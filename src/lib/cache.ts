import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { StreamEvent } from "./types";

const CACHE_DIR = path.join(process.cwd(), "data", "cache");
/** Bundled sample runs for the demo store, so the demo works without an API key. */
const SAMPLES_DIR = path.join(process.cwd(), "data", "samples");

export const cacheKey = (urls: string[]) =>
  createHash("sha1").update(urls.map((u) => u.toLowerCase().replace(/\/+$/, "")).join("|")).digest("hex").slice(0, 16);

async function readJson(file: string): Promise<StreamEvent[] | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

/** Prefers a real saved run; falls back to a bundled sample. */
export async function readCache(key: string): Promise<{ events: StreamEvent[]; sample: boolean } | null> {
  const saved = await readJson(path.join(CACHE_DIR, `${key}.json`));
  if (saved) return { events: saved, sample: false };
  const sample = await readJson(path.join(SAMPLES_DIR, `${key}.json`));
  if (sample) return { events: sample, sample: true };
  return null;
}

export async function writeCache(key: string, events: StreamEvent[]) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(events));
}

export async function writeSample(key: string, events: StreamEvent[]) {
  await fs.mkdir(SAMPLES_DIR, { recursive: true });
  await fs.writeFile(path.join(SAMPLES_DIR, `${key}.json`), JSON.stringify(events));
}
