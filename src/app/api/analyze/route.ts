import { NextRequest } from "next/server";
import { PERSONAS } from "@/lib/personas";
import { normalizeUrl, snapshotPage } from "@/lib/scrape";
import { compare, hasApiKey, runPersona, scoreFrom, summarize } from "@/lib/claude";
import { cacheKey, readCache, writeCache } from "@/lib/cache";
import type { PageSnapshot, PersonaResult, Side, StreamEvent, Summary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { urls?: string[]; fresh?: boolean };
  let urls: string[];
  try {
    urls = (body.urls ?? []).filter(Boolean).slice(0, 2).map(normalizeUrl);
    if (!urls.length) throw new Error("Enter a product page URL");
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
  // Pages on our own demo store resolve against this server.
  const origin = req.nextUrl.origin;
  const key = cacheKey(urls.map((u) => u.replace(origin, "")));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const recorded: StreamEvent[] = [];
      const send = (ev: StreamEvent, record = true) => {
        if (record && ev.type !== "status") recorded.push(ev);
        controller.enqueue(encoder.encode(JSON.stringify(ev) + "\n"));
      };

      try {
        // Without an API key, saved runs and bundled samples are always served (even if "fresh" was requested).
        const cached = body.fresh && hasApiKey() ? null : await readCache(key);
        if (cached) {
          await replay(cached.events, send, origin);
          send({ type: "done", cached: true, sample: cached.sample }, false);
          return;
        }
        if (!hasApiKey()) {
          send({
            type: "error",
            message:
              "Live analysis of new pages needs an ANTHROPIC_API_KEY in .env.local. The demo store buttons on the home page work without one.",
          });
          return;
        }

        const sides: Side[] = urls.length === 2 ? ["A", "B"] : ["A"];
        const outcomes = await Promise.all(sides.map((side, i) => analyzeSide(side, urls[i], send)));

        if (outcomes.length === 2 && outcomes[0] && outcomes[1]) {
          send({ type: "status", side: "A", message: "Predicting the A/B test winner…" });
          const comparison = await compare(outcomes[0], outcomes[1]);
          send({ type: "compare", comparison });
        }
        if (outcomes.every(Boolean)) await writeCache(key, recorded).catch(() => {});
        send({ type: "done" }, false);
      } catch (e) {
        send({ type: "error", message: (e as Error).message || "Something went wrong" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function analyzeSide(
  side: Side,
  url: string,
  send: (ev: StreamEvent) => void,
): Promise<{ snap: PageSnapshot; summary: Summary } | null> {
  try {
    send({ type: "status", side, message: "Opening the page in a real browser…" });
    const snap = await snapshotPage(url);
    send({ type: "snapshot", side, snapshot: snap });
    send({ type: "status", side, message: `${PERSONAS.length} shoppers are browsing…` });

    const results: PersonaResult[] = [];
    await Promise.all(
      PERSONAS.map(async (p) => {
        try {
          const result = await runPersona(p, snap);
          results.push(result);
          send({ type: "persona", side, result });
        } catch (e) {
          console.error(`[persona ${p.id}]`, e);
        }
      }),
    );
    if (!results.length) throw new Error("No shoppers could evaluate this page");

    send({ type: "status", side, message: "Writing your action plan…" });
    let summary: Summary;
    try {
      summary = await summarize(snap, results);
    } catch (e) {
      console.error("[summary]", e);
      summary = { score: scoreFrom(results), headline: "Panel complete.", strengths: [], fixes: [] };
    }
    send({ type: "summary", side, summary });
    return { snap, summary };
  } catch (e) {
    send({ type: "error", side, message: (e as Error).message });
    return null;
  }
}

/** Replays a cached run with realistic pacing so the demo still feels live. */
async function replay(events: StreamEvent[], send: (ev: StreamEvent, record?: boolean) => void, origin: string) {
  for (const ev of events) {
    if (ev.type === "snapshot") {
      send({ type: "status", side: ev.side, message: "Opening the page in a real browser…" }, false);
      await sleep(900);
      const url = ev.snapshot.url.startsWith("/") ? origin + ev.snapshot.url : ev.snapshot.url;
      send({ ...ev, snapshot: { ...ev.snapshot, url } }, false);
      send({ type: "status", side: ev.side, message: `${PERSONAS.length} shoppers are browsing…` }, false);
      await sleep(1200);
    } else if (ev.type === "persona") {
      await sleep(450 + Math.random() * 700);
      send(ev, false);
    } else if (ev.type === "summary") {
      send({ type: "status", side: ev.side, message: "Writing your action plan…" }, false);
      await sleep(1200);
      send(ev, false);
    } else if (ev.type === "compare") {
      await sleep(1000);
      send(ev, false);
    } else {
      send(ev, false);
    }
  }
}
