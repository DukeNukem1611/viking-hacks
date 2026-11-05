/**
 * Builds the bundled demo-store sample runs in data/samples/, so the demo works without an API key.
 *
 * Screenshots and page text come from the real scraper. The shopper reactions below were written
 * by hand from what is actually on each demo page; with an API key, "Re-run live" in the app
 * replaces them with real model output (saved to data/cache/, which takes priority).
 *
 * Usage (with `npm run dev` running on port 3000):
 *   npm run samples
 */
import { snapshotPage } from "../src/lib/scrape.ts";
import { cacheKey, writeSample } from "../src/lib/cache.ts";
import type { Comparison, PageSnapshot, PersonaResult, Side, StreamEvent, Summary } from "../src/lib/types.ts";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------- Version A
const personasA: PersonaResult[] = [
  {
    personaId: "maya",
    verdict: "leave",
    purchaseProbability: 18,
    furthestStage: "browsed",
    firstImpression: "A big beige banner and a mug, but I had to scroll to even find the price.",
    quote: "$38 for one mug plus mystery shipping? I can get a cute mug at Target for twelve bucks.",
    frictions: [
      { issue: "$38.00 with 'Shipping calculated at checkout', so I have no idea what the real total is.", severity: "high", category: "price" },
      { issue: "No discount code or free shipping threshold anywhere; the newsletter popup only promises 'updates, news and more'.", severity: "medium", category: "price" },
      { issue: "'Please create an account to complete checkout'. I'm not making an account for one mug.", severity: "medium", category: "checkout" },
    ],
    wouldConvince: "Show the total with shipping up front, or free shipping over a small amount.",
  },
  {
    personaId: "robert",
    verdict: "leave",
    purchaseProbability: 6,
    furthestStage: "browsed",
    firstImpression: "Never heard of Hearth & Kiln, and the first thing I see is 'Welcome to our shop!!'",
    quote: "No reviews, no address, no phone number, no return policy. I'm not typing my card into this.",
    frictions: [
      { issue: "'No reviews yet' on the product, so nobody has vouched for this store.", severity: "high", category: "trust" },
      { issue: "The footer only says '© Hearth & Kiln'. No address, phone, email or About page.", severity: "high", category: "trust" },
      { issue: "No return policy or secure-checkout information anywhere near the Add button.", severity: "medium", category: "trust" },
    ],
    wouldConvince: "Real customer reviews plus a visible phone number and return policy.",
  },
  {
    personaId: "priya",
    verdict: "leave",
    purchaseProbability: 9,
    furthestStage: "bounced",
    firstImpression: "A huge banner saying 'Simple. Beautiful. Ours.' tells me nothing about what I'm buying.",
    quote: "I scrolled past a banner, then a popup jumped up, and I still don't know when it would arrive. Closing this.",
    frictions: [
      { issue: "The top of the page is a generic 'New Collection' banner; the product, price and button are below the fold.", severity: "high", category: "clarity" },
      { issue: "No delivery estimate anywhere.", severity: "high", category: "shipping" },
      { issue: "The newsletter popup covers part of the product area as soon as the page loads.", severity: "medium", category: "design" },
    ],
    wouldConvince: "Product, price, delivery date and a big buy button visible the moment the page loads.",
  },
  {
    personaId: "jordan",
    verdict: "maybe",
    purchaseProbability: 22,
    furthestStage: "considered",
    firstImpression: "The speckled glaze looks nice, but there's only one real image.",
    quote: "'Our mugs are great' isn't a spec. Is it dishwasher safe? How tall is it? What's it made of?",
    frictions: [
      { issue: "The description is three generic sentences, with no dimensions, material or care instructions.", severity: "high", category: "product_info" },
      { issue: "Only one product image; the two thumbnails are empty gray boxes.", severity: "medium", category: "product_info" },
      { issue: "No reviews to confirm the quality in person.", severity: "low", category: "trust" },
    ],
    wouldConvince: "A specs list (size, stoneware, microwave and dishwasher safe, lead-free glaze) and more photos.",
  },
  {
    personaId: "linda",
    verdict: "leave",
    purchaseProbability: 8,
    furthestStage: "browsed",
    firstImpression: "Pretty mug, and it could make a nice gift for my sister.",
    quote: "There's no delivery date and no returns info. If it doesn't arrive by her birthday, it's useless to me.",
    frictions: [
      { issue: "No shipping speed or delivery date estimate.", severity: "high", category: "shipping" },
      { issue: "I can't find a return or exchange policy in case she doesn't like it.", severity: "high", category: "trust" },
      { issue: "No gift wrapping or gift note option.", severity: "medium", category: "other" },
    ],
    wouldConvince: "'Order today, arrives by ___' plus easy returns and a gift note option.",
  },
  {
    personaId: "sam",
    verdict: "maybe",
    purchaseProbability: 34,
    furthestStage: "considered",
    firstImpression: "It feels handmade and small-batch, which I like.",
    quote: "'Each one is a little different', so who makes them? I want the story before I pay $38.",
    frictions: [
      { issue: "Nothing about the maker, the studio or the materials, so the handmade angle is wasted.", severity: "medium", category: "product_info" },
      { issue: "There's a 'Blog' link but no About or Our Story page.", severity: "medium", category: "trust" },
      { issue: "No information about packaging or sustainability.", severity: "low", category: "product_info" },
    ],
    wouldConvince: "A short 'Made by…' section with the potter's story and where the clay comes from.",
  },
  {
    personaId: "carlos",
    verdict: "leave",
    purchaseProbability: 5,
    furthestStage: "bounced",
    firstImpression: "Okay, a mug. I could get one delivered tomorrow on Amazon.",
    quote: "Shipping unknown, no Apple Pay, and I have to create an account? Nope, back to Amazon.",
    frictions: [
      { issue: "You have to create an account to check out.", severity: "high", category: "checkout" },
      { issue: "No mention of shipping speed or free shipping.", severity: "high", category: "shipping" },
      { issue: "No express checkout (Shop Pay, Apple Pay or PayPal).", severity: "medium", category: "checkout" },
    ],
    wouldConvince: "Guest checkout with Apple Pay and fast free shipping.",
  },
  {
    personaId: "grace",
    verdict: "leave",
    purchaseProbability: 7,
    furthestStage: "browsed",
    firstImpression: "The price and text are small and very light gray, so I had to lean in to read them.",
    quote: "I can barely read the price, and a box popped up that I don't know how to close. I'll ask my grandson later.",
    frictions: [
      { issue: "The price and key details are in small, low-contrast gray text.", severity: "high", category: "design" },
      { issue: "The 'ADD' button is pale gray and doesn't look clickable.", severity: "medium", category: "design" },
      { issue: "No phone number to call with questions.", severity: "medium", category: "trust" },
    ],
    wouldConvince: "Bigger, darker text, a clear 'Add to cart' button and a phone number.",
  },
];

const summaryA: Omit<Summary, "score"> = {
  headline:
    "Shoppers find no reason to trust or buy: the price, shipping and reviews are hidden or missing, and checkout demands an account.",
  strengths: ["Attractive handmade product with a distinctive speckled glaze", "Calm, uncluttered brand look"],
  fixes: [
    {
      title: "Add reviews and visible trust details",
      problem: "Robert, Grace and Jordan found no reviews, contact details or return policy, and 'No reviews yet' actively hurts.",
      suggestion:
        "Import past customer reviews (even 5–10 from markets or Etsy) and add under the price: '★ 4.9 from 120+ happy customers · Free 30-day returns · Questions? Call (503) 555-0142'.",
      impact: "high",
      effort: "quick",
      personaIds: ["robert", "grace", "jordan", "linda"],
      estimatedLift: 10,
    },
    {
      title: "Show total cost and delivery date upfront",
      problem: "Maya, Linda, Carlos and Priya left over 'Shipping calculated at checkout' and the lack of any delivery estimate.",
      suggestion: "Replace the shipping line with: 'Free shipping on 2+ mugs · Order today, arrives by Mon, Nov 10'.",
      impact: "high",
      effort: "quick",
      personaIds: ["maya", "linda", "carlos", "priya"],
      estimatedLift: 9,
    },
    {
      title: "Allow guest checkout with express pay",
      problem: "'Please create an account to complete checkout' is a deal breaker for Carlos and Maya.",
      suggestion:
        "Turn on guest checkout plus Shop Pay and Apple Pay, remove the account note, and add '🔒 Secure checkout, no account needed' under the button.",
      impact: "high",
      effort: "moderate",
      personaIds: ["carlos", "maya", "priya"],
      estimatedLift: 7,
    },
    {
      title: "Put the product above the fold",
      problem: "The 'Simple. Beautiful. Ours.' banner pushes the photo, price and button below the first screen.",
      suggestion: "Remove the hero banner on product pages so the photo, price and a large dark 'Add to cart · $38' button appear immediately.",
      impact: "medium",
      effort: "quick",
      personaIds: ["priya", "grace", "carlos"],
      estimatedLift: 5,
    },
    {
      title: "Replace the description with specifics and a story",
      problem: "'Our mugs are great' answers none of Jordan's or Sam's questions.",
      suggestion:
        "Lead with 'Hand-thrown speckled stoneware mug, 12 oz', add bullets (4.2\" tall · microwave & dishwasher safe · lead-free glaze), then: 'Made by Ana in our 2-person Portland studio.'",
      impact: "medium",
      effort: "moderate",
      personaIds: ["jordan", "sam"],
      estimatedLift: 5,
    },
    {
      title: "Make text readable and delay the popup",
      problem: "Low-contrast gray text and an instant newsletter popup confused Grace and annoyed Priya.",
      suggestion:
        "Use dark text at 16px or larger for the price and description, and show the popup only after 30 seconds or on exit, offering '10% off your first order'.",
      impact: "medium",
      effort: "quick",
      personaIds: ["grace", "priya", "maya"],
      estimatedLift: 4,
    },
  ],
};

// ---------------------------------------------------------------- Version B
const personasB: PersonaResult[] = [
  {
    personaId: "maya",
    verdict: "maybe",
    purchaseProbability: 46,
    furthestStage: "added_to_cart",
    firstImpression: "The price is right there, $38, or 4 payments of $9.50.",
    quote: "Still pricey for one mug, but free returns and installments make it tempting. Maybe I'll split two with my roommate.",
    frictions: [
      { issue: "$38 is a lot for a single mug on a student budget.", severity: "high", category: "price" },
      { issue: "Free shipping only applies to 2+ mugs, so one mug still costs shipping.", severity: "medium", category: "shipping" },
      { issue: "No first-order discount code.", severity: "low", category: "price" },
    ],
    wouldConvince: "A 10% first-order code, or free shipping on a single mug.",
  },
  {
    personaId: "robert",
    verdict: "buy",
    purchaseProbability: 72,
    furthestStage: "purchased",
    firstImpression: "4.9 stars from 212 reviews, a phone number and an address. This looks like a real business.",
    quote: "Verified reviews, a Portland address and a phone number the owner answers herself. I'd trust this with my card.",
    frictions: [
      { issue: "The reviews are further down the page; I'd like a link to read all 212.", severity: "low", category: "trust" },
      { issue: "'30-day returns' is mentioned but there's no link to the full policy.", severity: "low", category: "trust" },
    ],
    wouldConvince: "Links to the full return policy and all of the reviews.",
  },
  {
    personaId: "priya",
    verdict: "buy",
    purchaseProbability: 70,
    furthestStage: "purchased",
    firstImpression: "Price, arrival date and a huge Add to cart button, all on the first screen.",
    quote: "Arrives Monday, free returns, Apple Pay. Done in thirty seconds.",
    frictions: [
      { issue: "The row of four mug thumbnails is a little unclear. Are they color options?", severity: "low", category: "clarity" },
    ],
    wouldConvince: "Label the thumbnails as color choices.",
  },
  {
    personaId: "jordan",
    verdict: "buy",
    purchaseProbability: 64,
    furthestStage: "purchased",
    firstImpression: "Finally some specs: 12 oz, 4.2 inches tall, lead-free glaze.",
    quote: "Wheel-thrown stoneware, dishwasher safe, real dimensions. I'd still love a photo of it in someone's hand for scale.",
    frictions: [
      { issue: "No close-up of the glaze texture or photo showing the mug's real size.", severity: "medium", category: "product_info" },
      { issue: "The color variants aren't named, so I can't tell which one is shown.", severity: "low", category: "product_info" },
    ],
    wouldConvince: "A close-up texture shot and a photo of the mug held in a hand.",
  },
  {
    personaId: "linda",
    verdict: "buy",
    purchaseProbability: 81,
    furthestStage: "purchased",
    firstImpression: "'Arrives by Mon, Nov 10', which is perfect for my sister's birthday.",
    quote: "Gift wrap with a handwritten note and free returns if she doesn't love it? That's exactly what I needed.",
    frictions: [
      { issue: "It doesn't say whether the packing slip shows the price.", severity: "low", category: "other" },
    ],
    wouldConvince: "Mention gift receipts, or no prices on the packing slip.",
  },
  {
    personaId: "sam",
    verdict: "buy",
    purchaseProbability: 76,
    furthestStage: "purchased",
    firstImpression: "'Handmade in Portland, OR' is right in the top bar, so I'm already interested.",
    quote: "Made by Ana in a two-person studio, local clay, plastic-free packaging. This is exactly who I want to buy from.",
    frictions: [
      { issue: "The studio story is below the fold; it could sit closer to the buy button.", severity: "low", category: "product_info" },
      { issue: "No photo of the maker or the studio.", severity: "low", category: "design" },
    ],
    wouldConvince: "A photo of Ana at the wheel.",
  },
  {
    personaId: "carlos",
    verdict: "maybe",
    purchaseProbability: 42,
    furthestStage: "considered",
    firstImpression: "Shop Pay and Apple Pay buttons, so at least checkout will be quick.",
    quote: "Guest checkout and Apple Pay are nice, but I'd still pay shipping on one mug. Amazon is free tomorrow.",
    frictions: [
      { issue: "A single mug doesn't qualify for free shipping.", severity: "high", category: "shipping" },
      { issue: "Delivery in about 5 days, versus next day on Amazon.", severity: "medium", category: "shipping" },
    ],
    wouldConvince: "Free shipping on a single mug, or a faster shipping option.",
  },
  {
    personaId: "grace",
    verdict: "maybe",
    purchaseProbability: 55,
    furthestStage: "added_to_cart",
    firstImpression: "Big, clear text and a large black button. I can read this.",
    quote: "I like that there's a phone number. I'd probably call first, but I think I could manage this myself.",
    frictions: [
      { issue: "'Shop Pay' and the countdown are unfamiliar and a bit confusing.", severity: "medium", category: "clarity" },
      { issue: "Some secondary text (installments, the checkout note) is small and gray.", severity: "low", category: "design" },
    ],
    wouldConvince: "A simple 'Questions? Call us' line right next to the button.",
  },
];

const summaryB: Omit<Summary, "score"> = {
  headline: "A strong, trustworthy page. The main remaining leak is the shipping cost on a single mug for price-sensitive shoppers.",
  strengths: [
    "Price, delivery date and add to cart all visible on the first screen",
    "Strong trust: 212 reviews, phone, address, free returns",
    "An authentic maker story that wins over values-driven buyers",
  ],
  fixes: [
    {
      title: "Offer free shipping on a single mug",
      problem: "Maya and Carlos still balk at paying shipping on one $38 mug.",
      suggestion: "Test 'Free shipping on every order' (build about $5 into the price), or lower the threshold so one mug qualifies.",
      impact: "high",
      effort: "moderate",
      personaIds: ["maya", "carlos"],
      estimatedLift: 8,
    },
    {
      title: "Add real photos for scale and texture",
      problem: "Jordan wants a close-up and a sense of size; Priya wasn't sure what the thumbnails were.",
      suggestion: "Add a close-up of the glaze and an in-hand photo, and label the thumbnails by glaze name (Oat, Sage, Clay, Lilac).",
      impact: "medium",
      effort: "moderate",
      personaIds: ["jordan", "priya", "sam"],
      estimatedLift: 4,
    },
    {
      title: "Add a first-order discount",
      problem: "Price-sensitive shoppers need one more nudge.",
      suggestion: "Show '10% off your first order with code HELLO10' under the price.",
      impact: "medium",
      effort: "quick",
      personaIds: ["maya", "carlos"],
      estimatedLift: 4,
    },
    {
      title: "Put help next to the buy button",
      problem: "Grace would call before buying, and the phone number is near the bottom of the page.",
      suggestion: "Add under the button: 'Questions? Call Ana at (503) 555-0142'.",
      impact: "low",
      effort: "quick",
      personaIds: ["grace", "robert"],
      estimatedLift: 2,
    },
  ],
};

const comparison: Comparison = {
  winner: "B",
  confidence: 93,
  reasoning:
    "Version B answers the questions that made shoppers leave Version A: it shows reviews, clear pricing, a delivery date and contact details, and drops forced account creation. Five of eight shoppers would buy from B versus none from A; the remaining hesitation on B is the shipping cost of a single mug.",
  differences: [
    { aspect: "Trust signals", a: "'No reviews yet', no contact info or return policy", b: "4.9★ from 212 reviews, phone, address, 30-day returns", better: "B" },
    { aspect: "Price & shipping", a: "Faint $38.00, 'shipping calculated at checkout'", b: "Bold $38, installments, free shipping on 2+ mugs", better: "B" },
    { aspect: "Delivery", a: "No delivery estimate", b: "'Arrives by Mon, Nov 10' plus a gift wrap option", better: "B" },
    { aspect: "Call to action", a: "Pale gray 'ADD' button below the fold", b: "Large 'Add to cart · $38' plus Shop Pay and Apple Pay", better: "B" },
    { aspect: "Checkout", a: "Account required", b: "Guest checkout, no account needed", better: "B" },
    { aspect: "Product info", a: "Three generic sentences", b: "Size, materials, care and the maker's story", better: "B" },
  ],
};

// ---------------------------------------------------------------- build
const score = (rs: PersonaResult[]) => Math.round(rs.reduce((s, r) => s + r.purchaseProbability, 0) / rs.length);

function sideEvents(side: Side, snapshot: PageSnapshot, personas: PersonaResult[], summary: Omit<Summary, "score">): StreamEvent[] {
  // Store the path, not localhost, so the sample replays correctly on any host.
  const snap = { ...snapshot, url: new URL(snapshot.url).pathname };
  return [
    { type: "snapshot", side, snapshot: snap },
    ...personas.map((result) => ({ type: "persona" as const, side, result })),
    { type: "summary", side, summary: { score: score(personas), ...summary } },
  ];
}

const snapA = await snapshotPage(`${BASE}/store/a`);
const snapB = await snapshotPage(`${BASE}/store/b`);
if (snapA.mode !== "browser" || snapB.mode !== "browser") throw new Error("Need a browser (Chrome/Edge) to capture screenshots");

const single = sideEvents("A", snapA, personasA, summaryA);
const ab = [...single, ...sideEvents("B", snapB, personasB, summaryB), { type: "compare", comparison } as StreamEvent];

await writeSample(cacheKey(["/store/a"]), single);
await writeSample(cacheKey(["/store/a", "/store/b"]), ab);
console.log(`Samples written. A score ${score(personasA)}, B score ${score(personasB)}.`);
