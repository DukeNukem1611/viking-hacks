import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Comparison, PageSnapshot, PersonaDef, PersonaResult, Summary } from "./types";
import { PERSONAS } from "./personas";

const MODEL = "claude-opus-5-5";

let _client: Anthropic | null = null;
const client = () => (_client ??= new Anthropic());

export const hasApiKey = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

// ---------- schemas ----------

const PersonaSchema = z.object({
  firstImpression: z.string().describe("What you noticed in the first 3 seconds, in your own voice, 1 sentence."),
  furthestStage: z
    .enum(["bounced", "browsed", "considered", "added_to_cart", "purchased"])
    .describe(
      "How far you realistically got: bounced = left almost immediately; browsed = scrolled/looked around but lost interest; considered = seriously evaluated buying but left; added_to_cart = added but abandoned before paying; purchased = would complete the purchase.",
    ),
  verdict: z.enum(["buy", "maybe", "leave"]),
  purchaseProbability: z.number().describe("Integer 0-100: realistic chance you buy on this visit."),
  quote: z
    .string()
    .describe("Your honest gut reaction, as a short spoken quote (max 25 words), specific to this page."),
  frictions: z
    .array(
      z.object({
        issue: z.string().describe("Specific problem on THIS page, referencing real elements, prices, or missing info."),
        severity: z.enum(["high", "medium", "low"]),
        category: z.enum(["price", "trust", "clarity", "shipping", "design", "product_info", "checkout", "other"]),
      }),
    )
    .describe("1-4 things that hurt your willingness to buy, most important first."),
  wouldConvince: z.string().describe("The single change that would most increase your chance of buying."),
});

const SummarySchema = z.object({
  headline: z.string().describe("One punchy sentence diagnosing the #1 reason this page loses sales."),
  strengths: z.array(z.string()).describe("2-3 things the page does well (short)."),
  fixes: z
    .array(
      z.object({
        title: z.string().describe("Imperative fix title, max 8 words."),
        problem: z.string().describe("What is wrong and evidence from the shoppers, 1-2 sentences."),
        suggestion: z
          .string()
          .describe("Concrete change. Include ready-to-paste copy (e.g. exact headline/badge text) where useful."),
        impact: z.enum(["high", "medium", "low"]),
        effort: z.enum(["quick", "moderate", "major"]),
        personaIds: z.array(z.string()).describe("IDs of shoppers this fix would win over."),
        estimatedLift: z.number().describe("Estimated increase in conversion score points (integer 1-25)."),
      }),
    )
    .describe("3-6 fixes ranked by expected impact on conversion."),
});

const CompareSchema = z.object({
  winner: z.enum(["A", "B", "tie"]),
  confidence: z.number().describe("Integer 50-99: confidence that the winner would convert better in a real A/B test."),
  reasoning: z.string().describe("2-3 sentences explaining why the winner converts better."),
  differences: z
    .array(
      z.object({
        aspect: z.string().describe("e.g. Pricing clarity, Trust, Call to action"),
        a: z.string().describe("How version A handles it (short)."),
        b: z.string().describe("How version B handles it (short)."),
        better: z.enum(["A", "B", "tie"]),
      }),
    )
    .describe("3-6 key differences that drive the outcome."),
});

// ---------- helpers ----------

function pageContent(snap: PageSnapshot): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = snap.screenshots.map((dataUrl) => ({
    type: "image" as const,
    source: { type: "base64" as const, media_type: "image/jpeg" as const, data: dataUrl.split(",")[1] },
  }));
  blocks.push({
    type: "text",
    text: [
      `URL: ${snap.url}`,
      `Page title: ${snap.title}`,
      snap.screenshots.length
        ? `The ${snap.screenshots.length} image(s) above are consecutive desktop screenshots of the page, top to bottom (what you see as you scroll).`
        : "No screenshots are available; rely on the page text.",
      "",
      "Detected page signals:",
      ...snap.signals.map((s) => `- ${s}`),
      "",
      "<page_text>",
      snap.text,
      "</page_text>",
    ].join("\n"),
  });
  return blocks;
}

async function parse<T extends z.ZodType>(
  schema: T,
  system: string,
  content: Anthropic.ContentBlockParam[],
  effort: "low" | "medium" | "high",
): Promise<z.infer<T>> {
  const res = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system,
    output_config: { effort, format: betaZodOutputFormat(schema) },
    // If a safety classifier declines (e.g. an unusual page), the API retries on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content }],
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined to analyze this page.");
  if (!res.parsed_output) throw new Error("Could not parse model output");
  return res.parsed_output as z.infer<T>;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

// ---------- public API ----------

export async function runPersona(persona: PersonaDef, snap: PageSnapshot): Promise<PersonaResult> {
  const system = `You are role-playing a real online shopper in a conversion research study. Stay fully in character.

Who you are: ${persona.profile}

You just landed on the store page shown below. React exactly as this person would during a ~60 second visit. Be specific: reference real prices, button labels, photos, wording, and anything missing that this person would look for. Do not be generically positive or negative: shoppers like you buy when the page answers your concerns and leave when it doesn't. Judge only what is actually visible on the page.`;
  const out = await parse(PersonaSchema, system, pageContent(snap), "low");
  return {
    personaId: persona.id,
    ...out,
    purchaseProbability: clamp(out.purchaseProbability, 0, 100),
    frictions: out.frictions.slice(0, 4),
  };
}

export function scoreFrom(results: PersonaResult[]): number {
  if (!results.length) return 0;
  return clamp(results.reduce((s, r) => s + r.purchaseProbability, 0) / results.length, 0, 100);
}

export async function summarize(snap: PageSnapshot, results: PersonaResult[]): Promise<Summary> {
  const panel = results
    .map((r) => {
      const p = PERSONAS.find((x) => x.id === r.personaId)!;
      return `## ${p.name} (id: ${p.id}, ${p.label})
verdict: ${r.verdict}, probability: ${r.purchaseProbability}%, got to: ${r.furthestStage}
quote: "${r.quote}"
frictions: ${r.frictions.map((f) => `[${f.severity}/${f.category}] ${f.issue}`).join("; ")}
would convince: ${r.wouldConvince}`;
    })
    .join("\n\n");

  const system =
    "You are a senior e-commerce conversion rate optimization consultant. You turn simulated shopper panel feedback into a prioritized, practical action plan for a small business owner with limited time and budget. Be concrete and specific to this page; avoid generic advice.";
  const content: Anthropic.ContentBlockParam[] = [
    ...pageContent(snap),
    {
      type: "text",
      text: `A panel of ${results.length} simulated shoppers visited this page. Their feedback:\n\n${panel}\n\nSynthesize this into a diagnosis and ranked fixes.`,
    },
  ];
  const out = await parse(SummarySchema, system, content, "medium");
  return {
    score: scoreFrom(results),
    headline: out.headline,
    strengths: out.strengths.slice(0, 3),
    fixes: out.fixes.slice(0, 6).map((f) => ({ ...f, estimatedLift: clamp(f.estimatedLift, 1, 25) })),
  };
}

export async function compare(
  a: { snap: PageSnapshot; summary: Summary },
  b: { snap: PageSnapshot; summary: Summary },
): Promise<Comparison> {
  const describe = (label: string, x: { snap: PageSnapshot; summary: Summary }) =>
    `# Version ${label}: ${x.snap.url}
Panel conversion score: ${x.summary.score}/100
Diagnosis: ${x.summary.headline}
Strengths: ${x.summary.strengths.join("; ")}
Top issues: ${x.summary.fixes.map((f) => f.title).join("; ")}
Page text excerpt:
${x.snap.text.slice(0, 4000)}`;

  const content: Anthropic.ContentBlockParam[] = [
    { type: "text", text: "Version A screenshots:" },
    ...a.snap.screenshots.slice(0, 2).map((d) => ({
      type: "image" as const,
      source: { type: "base64" as const, media_type: "image/jpeg" as const, data: d.split(",")[1] },
    })),
    { type: "text", text: "Version B screenshots:" },
    ...b.snap.screenshots.slice(0, 2).map((d) => ({
      type: "image" as const,
      source: { type: "base64" as const, media_type: "image/jpeg" as const, data: d.split(",")[1] },
    })),
    { type: "text", text: `${describe("A", a)}\n\n${describe("B", b)}\n\nPredict which version wins an A/B test.` },
  ];
  const out = await parse(
    CompareSchema,
    "You are an expert in e-commerce A/B testing. Compare two storefront page versions and predict which converts better, grounded in the shopper panel results and the pages themselves.",
    content,
    "medium",
  );
  return { ...out, confidence: clamp(out.confidence, 50, 99) };
}
