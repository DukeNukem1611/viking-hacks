import type { PageSnapshot } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const VIEW_W = 1280;
const VIEW_H = 860;
const MAX_SCREENS = 3;
const MAX_TEXT = 14000;

export function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only http(s) URLs are supported");
  return parsed.toString();
}

export async function snapshotPage(url: string): Promise<PageSnapshot> {
  try {
    return await snapshotWithBrowser(url);
  } catch (err) {
    console.warn("[scrape] browser capture failed, falling back to fetch:", (err as Error).message);
    return snapshotWithFetch(url);
  }
}

async function snapshotWithBrowser(url: string): Promise<PageSnapshot> {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({
      viewport: { width: VIEW_W, height: VIEW_H },
      userAgent: UA,
      deviceScaleFactor: 1,
      locale: "en-US",
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(1200);

    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const screens = Math.max(1, Math.min(MAX_SCREENS, Math.ceil(height / VIEW_H)));
    const screenshots: string[] = [];
    for (let i = 0; i < screens; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * VIEW_H);
      await page.waitForTimeout(500);
      const buf = await page.screenshot({ type: "jpeg", quality: 72 });
      screenshots.push(`data:image/jpeg;base64,${buf.toString("base64")}`);
    }

    const extracted = await page.evaluate(() => {
      const ld: string[] = [];
      document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
        ld.push((s.textContent || "").slice(0, 3000));
      });
      const buttons = Array.from(document.querySelectorAll("button, a[role=button], input[type=submit]"))
        .map((b) => ((b as HTMLElement).innerText || (b as HTMLInputElement).value || "").trim())
        .filter((t) => t && t.length < 40)
        .slice(0, 25);
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      return {
        title: document.title,
        text: document.body?.innerText || "",
        ld,
        buttons,
        metaDesc,
        images: document.images.length,
      };
    });

    return {
      url: page.url(),
      title: extracted.title || url,
      screenshots,
      text: extracted.text.replace(/\n{3,}/g, "\n\n").slice(0, MAX_TEXT),
      signals: buildSignals(extracted.ld, extracted.buttons, extracted.metaDesc, extracted.images),
      mode: "browser",
    };
  } finally {
    await browser.close();
  }
}

/** Uses Playwright's bundled Chromium if installed, otherwise the system's Chrome or Edge. */
async function launchBrowser() {
  const { chromium } = await import("playwright-core");
  const attempts: Parameters<typeof chromium.launch>[0][] = [
    { headless: true },
    { headless: true, channel: "chrome" },
    { headless: true, channel: "msedge" },
  ];
  let lastErr: unknown;
  for (const opts of attempts) {
    try {
      return await chromium.launch(opts);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function snapshotWithFetch(url: string): Promise<PageSnapshot> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow" });
  if (!res.ok) throw new Error(`Could not load page (HTTP ${res.status})`);
  const html = await res.text();
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? url).trim();
  const ld = Array.from(html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)).map((m) =>
    m[1].slice(0, 3000),
  );
  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ?? "";
  const text = decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, MAX_TEXT);
  return {
    url: res.url || url,
    title,
    screenshots: [],
    text,
    signals: buildSignals(ld, [], metaDesc, (html.match(/<img/gi) || []).length),
    mode: "fetch",
  };
}

function buildSignals(ld: string[], buttons: string[], metaDesc: string, images: number): string[] {
  const signals: string[] = [];
  if (metaDesc) signals.push(`Meta description: ${metaDesc}`);
  signals.push(`Images on page: ${images}`);
  if (buttons.length) signals.push(`Buttons/CTAs found: ${[...new Set(buttons)].join(" | ")}`);
  for (const block of ld) {
    try {
      const data = JSON.parse(block);
      const items = Array.isArray(data) ? data : data["@graph"] ?? [data];
      for (const item of items) {
        if (String(item["@type"]).toLowerCase().includes("product")) {
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (item.name) signals.push(`Structured product name: ${item.name}`);
          if (offer?.price) signals.push(`Structured price: ${offer.price} ${offer.priceCurrency ?? ""}`);
          if (item.aggregateRating)
            signals.push(
              `Structured rating: ${item.aggregateRating.ratingValue} from ${item.aggregateRating.reviewCount ?? item.aggregateRating.ratingCount ?? "?"} reviews`,
            );
        }
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  return signals;
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}
