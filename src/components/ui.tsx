"use client";

import { useState } from "react";
import { personaById, PERSONAS } from "@/lib/personas";
import { STAGES, STAGE_LABELS, type Fix, type PageSnapshot, type PersonaResult, type Summary } from "@/lib/types";

export const scoreColor = (s: number) => (s >= 55 ? "#16a34a" : s >= 30 ? "#d97706" : "#dc2626");
export const scoreWord = (s: number) => (s >= 55 ? "Strong" : s >= 30 ? "Leaky" : "Losing sales");

export function Avatar({ id, size = 44 }: { id: string; size?: number }) {
  const p = personaById(id);
  if (!p) return null;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full ring-2 ring-white"
      style={{ width: size, height: size, background: `${p.color}22`, fontSize: size * 0.5 }}
      title={`${p.name}, ${p.label}`}
    >
      {p.emoji}
    </div>
  );
}

export function ScoreGauge({ score, size = 168, label = "Predicted conversion" }: { score: number | null; size?: number; label?: string }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const pct = score ?? 0;
  const color = score === null ? "#cbd5e1" : scoreColor(pct);
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} stroke="var(--track)" strokeWidth="14" fill="none" />
        <circle
          cx="90"
          cy="90"
          r={r}
          stroke={color}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1), stroke .4s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold tabular-nums" style={{ color, fontSize: size * 0.24 }}>
          {score === null ? "–" : score}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">/ 100</span>
      </div>
      </div>
      <p className="text-sm font-medium text-muted">{label}</p>
      {score !== null && (
        <p className="mt-0.5 text-sm font-semibold" style={{ color }}>
          {scoreWord(score)}
        </p>
      )}
    </div>
  );
}

export function Funnel({ results, compact = false }: { results: PersonaResult[]; compact?: boolean }) {
  const total = PERSONAS.length;
  const idx = (s: string) => STAGES.indexOf(s as (typeof STAGES)[number]);
  return (
    <div className="space-y-2">
      {STAGES.map((stage, i) => {
        const reached = i === 0 ? results.length : results.filter((r) => idx(r.furthestStage) >= i).length;
        const pct = (reached / total) * 100;
        return (
          <div key={stage} className="flex items-center gap-3">
            <span className={`w-28 shrink-0 text-right text-muted ${compact ? "text-xs" : "text-sm"}`}>{STAGE_LABELS[stage]}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-[var(--track)]">
              <div
                className="h-full rounded-md"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, var(--accent), var(--accent-2))`,
                  opacity: 1 - i * 0.12,
                  transition: "width .8s cubic-bezier(.2,.8,.2,1)",
                }}
              />
              <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold tabular-nums text-ink">
                {reached}/{total}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const VERDICT = {
  buy: { label: "Would buy", cls: "bg-green-100 text-green-800" },
  maybe: { label: "On the fence", cls: "bg-amber-100 text-amber-800" },
  leave: { label: "Left", cls: "bg-red-100 text-red-800" },
} as const;

const SEV = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-slate-400" } as const;

export function PersonaCard({ id, result }: { id: string; result?: PersonaResult }) {
  const p = personaById(id)!;
  const [open, setOpen] = useState(false);
  if (!result) {
    return (
      <div className="card flex items-center gap-3 p-4 opacity-80">
        <div className="animate-pulse">
          <Avatar id={id} />
        </div>
        <div className="flex-1">
          <p className="font-semibold">
            {p.name}, {p.age} <span className="font-normal text-muted">· {p.label}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <span className="typing">
              <i />
              <i />
              <i />
            </span>
            browsing the page
          </p>
        </div>
      </div>
    );
  }
  const v = VERDICT[result.verdict];
  return (
    <div className="card pop-in p-4">
      <div className="flex items-start gap-3">
        <Avatar id={id} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">
              {p.name}, {p.age} <span className="font-normal text-muted">· {p.label}</span>
            </p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.cls}`}>{v.label}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--track)]">
              <div className="h-full rounded-full" style={{ width: `${result.purchaseProbability}%`, background: scoreColor(result.purchaseProbability) }} />
            </div>
            <span className="w-10 text-right text-xs font-semibold tabular-nums">{result.purchaseProbability}%</span>
          </div>
        </div>
      </div>
      <div className="bubble mt-3">&ldquo;{result.quote}&rdquo;</div>
      <button onClick={() => setOpen(!open)} className="mt-3 text-xs font-semibold text-accent hover:underline">
        {open ? "Hide details" : `Why? ${result.frictions.length} friction point${result.frictions.length === 1 ? "" : "s"} →`}
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-sm">
          <p className="text-muted">
            <b className="text-ink">First impression:</b> {result.firstImpression}
          </p>
          <ul className="space-y-1.5">
            {result.frictions.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEV[f.severity]}`} />
                <span>{f.issue}</span>
              </li>
            ))}
          </ul>
          <p className="rounded-lg bg-[var(--accent-soft)] p-2.5">
            <b>What would win me over:</b> {result.wouldConvince}
          </p>
        </div>
      )}
    </div>
  );
}

const IMPACT = { high: "bg-red-100 text-red-800", medium: "bg-amber-100 text-amber-800", low: "bg-slate-100 text-slate-700" };
const EFFORT = { quick: "⚡ Quick win", moderate: "🛠 Moderate", major: "🏗 Bigger project" };

export function FixList({ fixes }: { fixes: Fix[] }) {
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <ol className="space-y-3">
      {fixes.map((f, i) => (
        <li key={i} className="card pop-in flex gap-4 p-5" style={{ animationDelay: `${i * 90}ms` }}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="mr-1 text-base font-semibold">{f.title}</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${IMPACT[f.impact]}`}>{f.impact} impact</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{EFFORT[f.effort]}</span>
              <span className="ml-auto text-sm font-bold text-green-700">+{f.estimatedLift} pts</span>
            </div>
            <p className="mt-1.5 text-sm text-muted">{f.problem}</p>
            <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-dashed border-[var(--line)] bg-[var(--accent-soft)] p-3 text-sm">
              <p className="flex-1">
                <b>Do this:</b> {f.suggestion}
              </p>
              <button
                className="shrink-0 text-xs font-semibold text-accent hover:underline"
                onClick={() => {
                  navigator.clipboard?.writeText(f.suggestion).catch(() => {});
                  setCopied(i);
                  setTimeout(() => setCopied(null), 1500);
                }}
              >
                {copied === i ? "Copied ✓" : "Copy"}
              </button>
            </div>
            {f.personaIds.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-muted">
                <div className="flex -space-x-2">
                  {f.personaIds.filter((id) => personaById(id)).map((id) => (
                    <Avatar key={id} id={id} size={26} />
                  ))}
                </div>
                wins over {f.personaIds.map((id) => personaById(id)?.name).filter(Boolean).join(", ")}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PagePreview({ snapshot, status }: { snapshot?: PageSnapshot; status?: string }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--panel-2)] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-2 truncate rounded bg-[var(--panel)] px-2 py-0.5 text-xs text-muted">{snapshot?.url ?? "loading…"}</span>
      </div>
      <div className="max-h-[560px] overflow-y-auto bg-[var(--panel-2)]">
        {!snapshot && (
          <div className="flex h-72 flex-col items-center justify-center gap-3 text-sm text-muted">
            <div className="spinner" />
            {status ?? "Loading page…"}
          </div>
        )}
        {snapshot?.screenshots.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={s} alt={`Page screenshot ${i + 1}`} className="block w-full" />
        ))}
        {snapshot && snapshot.screenshots.length === 0 && (
          <div className="p-5 text-sm">
            <p className="font-semibold">{snapshot.title}</p>
            <p className="mt-2 text-xs text-muted">Screenshot unavailable, so shoppers read the page text instead.</p>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-muted">{snapshot.text.slice(0, 2000)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export function SummaryHeader({ summary, results }: { summary?: Summary; results: PersonaResult[] }) {
  const buyers = results.filter((r) => r.verdict === "buy").length;
  return (
    <div className="card grid gap-6 p-6 md:grid-cols-[200px_1fr_1fr] md:items-center">
      <ScoreGauge score={summary ? summary.score : null} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Diagnosis</p>
        {summary ? (
          <p className="mt-1 text-xl font-semibold leading-snug">{summary.headline}</p>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="skeleton h-5 w-11/12" />
            <div className="skeleton h-5 w-3/4" />
          </div>
        )}
        <p className="mt-3 text-sm text-muted">
          {results.length}/{PERSONAS.length} shoppers done · <b className="text-ink">{buyers}</b> would buy
        </p>
        {summary && summary.strengths.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {summary.strengths.map((s, i) => (
              <span key={i} className="rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-800">
                ✓ {s}
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">Shopper funnel</p>
        <Funnel results={results} compact />
      </div>
    </div>
  );
}
