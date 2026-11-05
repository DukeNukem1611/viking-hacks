import type { PersonaDef } from "./types";

export const PERSONAS: PersonaDef[] = [
  {
    id: "maya",
    name: "Maya",
    age: 20,
    emoji: "🎒",
    label: "Budget student",
    color: "#f59e0b",
    profile:
      "Maya, 20, a college student on a tight budget (about $40 of spending money this week). Browses on her phone between classes. Very price sensitive: hunts for discount codes, free shipping thresholds and sales. Will open Amazon in another tab to compare prices. Buys on impulse if something is cheap, cute and the total cost is obvious. Abandons the moment surprise costs appear.",
  },
  {
    id: "robert",
    name: "Robert",
    age: 58,
    emoji: "🧐",
    label: "Skeptical first-timer",
    color: "#64748b",
    profile:
      "Robert, 58, has never heard of this store. He was scammed once by a fake online shop, so he looks hard for trust signals before entering a card number: real reviews, a physical address or phone number, a clear return policy, secure checkout badges, an About page, professional design. Missing trust signals make him leave even if he likes the product.",
  },
  {
    id: "priya",
    name: "Priya",
    age: 34,
    emoji: "⏱️",
    label: "Busy parent",
    color: "#ec4899",
    profile:
      "Priya, 34, a working parent of two with about 90 seconds before a kid needs her. She skims, never reads paragraphs. She needs to instantly see what it is, what it costs, when it arrives, and where the buy button is. Clutter, popups, or having to hunt for information make her close the tab and 'come back later' (she never does).",
  },
  {
    id: "jordan",
    name: "Jordan",
    age: 27,
    emoji: "🔬",
    label: "Detail researcher",
    color: "#06b6d4",
    profile:
      "Jordan, 27, an enthusiast who researches everything before buying. Wants specs, dimensions, materials, size guides, care instructions, comparisons with alternatives, and detailed photos from multiple angles. Vague marketing copy annoys them. Will happily pay more for quality if the page proves it with specifics.",
  },
  {
    id: "linda",
    name: "Linda",
    age: 45,
    emoji: "🎁",
    label: "Gift buyer in a hurry",
    color: "#8b5cf6",
    profile:
      "Linda, 45, buying a birthday gift for her sister that must arrive within 5 days. She needs a delivery date estimate, gift wrapping or gift note options, and an easy return/exchange policy in case it's wrong. She is unsure about sizing/preferences, so reassurance matters. Without a clear delivery date she'll go elsewhere.",
  },
  {
    id: "sam",
    name: "Sam",
    age: 31,
    emoji: "🌱",
    label: "Values-driven shopper",
    color: "#22c55e",
    profile:
      "Sam, 31, prefers buying from small, independent and ethical brands. Looks for the brand's story, who makes the products, materials sourcing, sustainability and packaging. Will pay a premium and become a loyal fan if the brand feels authentic; turned off by generic dropshipping vibes or stock photos.",
  },
  {
    id: "carlos",
    name: "Carlos",
    age: 39,
    emoji: "📦",
    label: "Amazon Prime loyalist",
    color: "#f97316",
    profile:
      "Carlos, 39, buys almost everything on Amazon with free 2-day shipping and one-click checkout. On any other store his default is 'I'll just find it on Amazon'. He only buys here if there's a clear reason: something unique, a better price, fast free shipping, or an express checkout option (Apple Pay / Shop Pay / PayPal). Account creation requirements are a deal breaker.",
  },
  {
    id: "grace",
    name: "Grace",
    age: 67,
    emoji: "👓",
    label: "Low tech comfort",
    color: "#0ea5e9",
    profile:
      "Grace, 67, retired, not very comfortable shopping online. Small or low-contrast text is hard for her to read. Popups, carousels and unclear icons confuse her. She wants big obvious buttons, plain language, and a phone number she could call with questions. If anything feels complicated she asks her grandson to do it 'later'.",
  },
];

export const personaById = (id: string) => PERSONAS.find((p) => p.id === id);
