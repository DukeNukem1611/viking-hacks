import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { StreamEvent } from "./types";

const DIR = path.join(process.cwd(), "data", "cache");

export const cacheKey = (urls: string[]) =>
  createHash("sha1").update(urls.map((u) => u.toLowerCase().replace(/\/+$/, "")).join("|")).digest("hex").slice(0, 16);

export async function readCache(key: string): Promise<StreamEvent[] | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(DIR, `${key}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function writeCache(key: string, events: StreamEvent[]) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${key}.json`), JSON.stringify(events));
}
