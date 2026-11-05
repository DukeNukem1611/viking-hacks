export const STAGES = ["bounced", "browsed", "considered", "added_to_cart", "purchased"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  bounced: "Landed",
  browsed: "Engaged",
  considered: "Considered",
  added_to_cart: "Added to cart",
  purchased: "Purchased",
};

export type Side = "A" | "B";

export interface PersonaDef {
  id: string;
  name: string;
  age: number;
  emoji: string;
  label: string;
  color: string;
  profile: string;
}

export interface Friction {
  issue: string;
  severity: "high" | "medium" | "low";
  category: "price" | "trust" | "clarity" | "shipping" | "design" | "product_info" | "checkout" | "other";
}

export interface PersonaResult {
  personaId: string;
  verdict: "buy" | "maybe" | "leave";
  purchaseProbability: number;
  furthestStage: Stage;
  firstImpression: string;
  quote: string;
  frictions: Friction[];
  wouldConvince: string;
}

export interface Fix {
  title: string;
  problem: string;
  suggestion: string;
  impact: "high" | "medium" | "low";
  effort: "quick" | "moderate" | "major";
  personaIds: string[];
  estimatedLift: number;
}

export interface Summary {
  score: number;
  headline: string;
  strengths: string[];
  fixes: Fix[];
}

export interface PageSnapshot {
  url: string;
  title: string;
  screenshots: string[];
  text: string;
  signals: string[];
  mode: "browser" | "fetch";
}

export interface Comparison {
  winner: "A" | "B" | "tie";
  confidence: number;
  reasoning: string;
  differences: { aspect: string; a: string; b: string; better: "A" | "B" | "tie" }[];
}

export type StreamEvent =
  | { type: "status"; side: Side; message: string }
  | { type: "snapshot"; side: Side; snapshot: PageSnapshot }
  | { type: "persona"; side: Side; result: PersonaResult }
  | { type: "summary"; side: Side; summary: Summary }
  | { type: "compare"; comparison: Comparison }
  | { type: "error"; side?: Side; message: string }
  | { type: "done"; cached?: boolean };
