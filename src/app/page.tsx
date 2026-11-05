"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { PERSONAS } from "@/lib/personas";
import type { Comparison, PageSnapshot, PersonaResult, Side, StreamEvent, Summary } from "@/lib/types";
import { Avatar, FixList, Funnel, PagePreview, PersonaCard, ScoreGauge, SummaryHeader, scoreColor } from "@/components/ui";

type SideState = {
  url: string;
  snapshot?: PageSnapshot;
  personas: Record<string, PersonaResult>;
  summary?: Summary;
  status?: string;
  error?: string;
};

const emptySide = (url: string): SideState => ({ url, personas: {} });

export default function Home() {
  const [mode, setMode] = useState<"single" | "ab">("single");
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [running, setRunning] = useState(false);
  const [sides, setSides] = useState<Partial<Record<Side, SideState>> | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<null | "saved" | "sample">(null);
  const abortRef = useRef<AbortController | null>(null);

  async function run(urls: string[], fresh = false) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRunning(true);
    setError(null);
    setComparison(null);
    setCached(null);
    setSides(urls.length === 2 ? { A: emptySide(urls[0]), B: emptySide(urls[1]) } : { A: emptySide(urls[0]) });
    window.scrollTo({ top: 0, behavior: "smooth" });

    const patch = (side: Side, fn: (s: SideState) => SideState) =>
      setSides((prev) => (prev && prev[side] ? { ...prev, [side]: fn(prev[side]!) } : prev));

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, fresh }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as StreamEvent;
          switch (ev.type) {
            case "status":
              patch(ev.side, (s) => ({ ...s, status: ev.message }));
              break;
            case "snapshot":
              patch(ev.side, (s) => ({ ...s, snapshot: ev.snapshot }));
              break;
            case "persona":
              patch(ev.side, (s) => ({ ...s, personas: { ...s.personas, [ev.result.personaId]: ev.result } }));
              break;
            case "summary":
              patch(ev.side, (s) => ({ ...s, summary: ev.summary, status: undefined }));
              break;
            case "compare":
              setComparison(ev.comparison);
              break;
            case "error":
              if (ev.side) patch(ev.side, (s) => ({ ...s, error: ev.message, status: undefined }));
              else setError(ev.message);
              break;
            case "done":
              setCached(ev.sample ? "sample" : ev.cached ? "saved" : null);
              break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = mode === "ab" ? [urlA, urlB] : [urlA];
    if (urls.some((u) => !u.trim())) return;
    run(urls);
  };

  const demo = (which: "single" | "ab") => {
    const o = window.location.origin;
    if (which === "single") {
      setMode("single");
      setUrlA(`${o}/store/a`);
      run([`${o}/store/a`]);
    } else {
      setMode("ab");
      setUrlA(`${o}/store/a`);
      setUrlB(`${o}/store/b`);
      run([`${o}/store/a`, `${o}/store/b`]);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setSides(null);
    setComparison(null);
    setError(null);
    setRunning(false);
  };

  return (
    <div className="min-h-screen">
      <Nav onHome={reset} showNew={!!sides} running={running} />

      {!sides ? (
        <Landing
          mode={mode}
          setMode={setMode}
          urlA={urlA}
          urlB={urlB}
          setUrlA={setUrlA}
          setUrlB={setUrlB}
          onSubmit={submit}
          onDemo={demo}
        />
      ) : (
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6">
          {error && (
            <div className="card mb-6 border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <b>Couldn&apos;t finish:</b> {error}
            </div>
          )}
          {cached && !running && (
            <div className="mb-4 flex items-center justify-end gap-3 text-xs text-muted">
              {cached === "sample" ? "Sample results bundled with the demo store." : "Showing a saved run."}
              <button
                className="font-semibold text-accent hover:underline"
                onClick={() => run(Object.values(sides).map((s) => s!.url), true)}
              >
                Re-run live ↻{cached === "sample" ? " (needs API key)" : ""}
              </button>
            </div>
          )}
          {sides.B ? (
            <ABView a={sides.A!} b={sides.B} comparison={comparison} running={running} />
          ) : (
            <SideDetail side={sides.A!} />
          )}
        </main>
      )}
    </div>
  );
}

function Nav({ onHome, showNew, running }: { onHome: () => void; showNew: boolean; running: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <button onClick={onHome} className="flex items-center" aria-label="ShopperSim home">
          <Image src="/logo.png" alt="ShopperSim" width={1567} height={386} priority className="h-8 w-auto" />
        </button>
        <div className="flex items-center gap-3">
          {running && (
            <span className="hidden items-center gap-2 text-sm text-muted sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Panel in session
            </span>
          )}
          {showNew && (
            <button onClick={onHome} className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--panel-2)]">
              New test
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Landing(props: {
  mode: "single" | "ab";
  setMode: (m: "single" | "ab") => void;
  urlA: string;
  urlB: string;
  setUrlA: (s: string) => void;
  setUrlB: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDemo: (w: "single" | "ab") => void;
}) {
  const { mode, setMode, urlA, urlB, setUrlA, setUrlB, onSubmit, onDemo } = props;
  return (
    <main className="hero-glow">
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-16 text-center sm:pt-24">
        <p className="mx-auto w-fit rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-medium text-muted">
          For small online stores that can&apos;t afford user research
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
          Meet your customers <span className="gradient-text">before they leave.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
          Paste a product page. Eight AI shoppers with real budgets, doubts and deadlines browse it, tell you exactly why
          they didn&apos;t buy, and hand you a ranked list of fixes.
        </p>

        <form onSubmit={onSubmit} className="card mx-auto mt-10 max-w-2xl p-3 text-left">
          <div className="mb-3 flex gap-1 rounded-xl bg-[var(--panel-2)] p-1 text-sm font-medium">
            {(["single", "ab"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 transition ${mode === m ? "bg-white shadow-sm" : "text-muted"}`}
              >
                {m === "single" ? "Analyze a page" : "A/B test two pages"}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <UrlInput label={mode === "ab" ? "A" : undefined} value={urlA} onChange={setUrlA} placeholder="https://yourstore.com/products/..." />
            {mode === "ab" && <UrlInput label="B" value={urlB} onChange={setUrlB} placeholder="https://yourstore.com/products/...-v2" />}
          </div>
          <button type="submit" className="btn-primary mt-3 w-full py-3.5 text-base">
            {mode === "ab" ? "Predict the winner →" : "Send in the shoppers →"}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-muted">Try the demo store:</span>
          <button onClick={() => onDemo("single")} className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 font-medium hover:border-[var(--accent)]">
            🏺 Hearth &amp; Kiln mug page
          </button>
          <button onClick={() => onDemo("ab")} className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 font-medium hover:border-[var(--accent)]">
            ⚖️ A/B: old vs redesigned page
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-accent">Meet the panel</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PERSONAS.map((p) => (
            <div key={p.id} className="card flex items-center gap-3 p-3">
              <Avatar id={p.id} size={40} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {p.name}, {p.age}
                </p>
                <p className="truncate text-xs text-muted">{p.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            ["1", "We open your page in a real browser", "Full screenshots and page content, exactly what a visitor sees."],
            ["2", "8 shoppers react in parallel", "Each one has a budget, worries and a deadline, and decides whether to buy."],
            ["3", "You get a ranked fix list", "Where people drop off, why, and ready-to-paste fixes sorted by impact."],
          ].map(([n, t, d]) => (
            <div key={n} className="card p-5">
              <span className="gradient-text text-2xl font-bold">{n}</span>
              <p className="mt-1 font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function UrlInput({ label, value, onChange, placeholder }: { label?: string; value: string; onChange: (s: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 focus-within:border-[var(--accent)]">
      {label && (
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-soft)] text-xs font-bold text-accent">{label}</span>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent py-3 text-base outline-none"
        required
      />
    </div>
  );
}

function SideDetail({ side }: { side: SideState }) {
  const results = Object.values(side.personas);
  const totalLift = side.summary?.fixes.reduce((s, f) => s + f.estimatedLift, 0) ?? 0;
  return (
    <div className="space-y-6">
      {side.error && <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-800">{side.error}</div>}
      <SummaryHeader summary={side.summary} results={results} />
      <div className="grid gap-6 lg:grid-cols-[5fr_7fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">What shoppers saw</p>
          <PagePreview snapshot={side.snapshot} status={side.status} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">The shopper panel</p>
            {side.status && side.snapshot && <p className="text-xs text-muted">{side.status}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PERSONAS.map((p) => (
              <PersonaCard key={p.id} id={p.id} result={side.personas[p.id]} />
            ))}
          </div>
        </div>
      </div>
      {side.summary && side.summary.fixes.length > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold">Your action plan</h2>
              <p className="text-sm text-muted">Ranked by expected impact on conversion</p>
            </div>
            <p className="text-sm">
              Potential: <b style={{ color: scoreColor(side.summary.score) }}>{side.summary.score}</b> →{" "}
              <b className="text-green-700">{Math.min(100, side.summary.score + totalLift)}</b> / 100
            </p>
          </div>
          <FixList fixes={side.summary.fixes} />
        </section>
      )}
    </div>
  );
}

function ABView({ a, b, comparison, running }: { a: SideState; b: SideState; comparison: Comparison | null; running: boolean }) {
  const [tab, setTab] = useState<Side>("A");
  return (
    <div className="space-y-6">
      <div
        className="card overflow-hidden p-6 text-white"
        style={{ background: "linear-gradient(120deg, var(--navy), #0a4fc4 50%, var(--accent))", borderColor: "transparent" }}
      >
        {comparison ? (
          <div className="pop-in">
            <p className="text-sm font-medium uppercase tracking-wider text-white/70">Predicted A/B test result</p>
            <p className="mt-1 text-3xl font-bold">
              {comparison.winner === "tie" ? "Too close to call" : `Version ${comparison.winner} wins`}
              <span className="ml-3 rounded-full bg-white/20 px-3 py-1 align-middle text-sm font-semibold">
                {comparison.confidence}% confidence
              </span>
            </p>
            <p className="mt-3 max-w-3xl text-white/90">{comparison.reasoning}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="spinner" style={{ borderColor: "rgba(255,255,255,.25)", borderTopColor: "white" }} />
            <p className="text-lg font-semibold">{running ? "Both versions are in front of the panel…" : "Comparison unavailable"}</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(["A", "B"] as const).map((k) => {
          const s = k === "A" ? a : b;
          const results = Object.values(s.personas);
          const win = comparison?.winner === k;
          return (
            <div key={k} className={`card p-5 ${win ? "ring-2 ring-[var(--accent)]" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] text-sm font-bold text-accent">{k}</span>
                  <span className="truncate text-sm text-muted">{s.url}</span>
                </div>
                {win && <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-semibold text-white">🏆 Winner</span>}
              </div>
              <div className="mt-4 grid items-center gap-4 sm:grid-cols-[140px_1fr]">
                <ScoreGauge score={s.summary ? s.summary.score : null} size={130} label="Conversion" />
                <Funnel results={results} compact />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {PERSONAS.map((p) => {
                  const r = s.personas[p.id];
                  const dot = !r ? "bg-slate-200" : r.verdict === "buy" ? "bg-green-500" : r.verdict === "maybe" ? "bg-amber-400" : "bg-red-500";
                  return (
                    <div key={p.id} className="relative">
                      <Avatar id={p.id} size={32} />
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${dot}`} />
                    </div>
                  );
                })}
              </div>
              {s.error && <p className="mt-3 text-sm text-red-700">{s.error}</p>}
            </div>
          );
        })}
      </div>

      {comparison && comparison.differences.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-xs uppercase tracking-wider text-muted">
                <th className="p-4">What changed</th>
                <th className="p-4">Version A</th>
                <th className="p-4">Version B</th>
              </tr>
            </thead>
            <tbody>
              {comparison.differences.map((d, i) => (
                <tr key={i} className="border-b border-[var(--line)] last:border-0">
                  <td className="p-4 font-semibold">{d.aspect}</td>
                  <td className={`p-4 ${d.better === "A" ? "bg-green-50 font-medium text-green-900" : "text-muted"}`}>{d.a}</td>
                  <td className={`p-4 ${d.better === "B" ? "bg-green-50 font-medium text-green-900" : "text-muted"}`}>{d.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <div className="mb-4 flex gap-1 rounded-xl bg-[var(--panel-2)] p-1 text-sm font-medium sm:w-fit">
          {(["A", "B"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-2 ${tab === k ? "bg-white shadow-sm" : "text-muted"}`}>
              Version {k} details
            </button>
          ))}
        </div>
        <SideDetail side={tab === "A" ? a : b} />
      </div>
    </div>
  );
}
