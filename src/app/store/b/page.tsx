import type { Metadata } from "next";
import { Mug } from "../Mug";

export const metadata: Metadata = { title: "Speckled Stoneware Mug, Handmade 12 oz | Hearth & Kiln" };

const reviews = [
  { name: "Erin T.", text: "Heavier and nicer in person. Keeps my coffee hot and the glaze is gorgeous.", when: "2 weeks ago" },
  { name: "Marcus L.", text: "Bought two as a wedding gift. Arrived in 3 days, beautifully packed with a handwritten note.", when: "1 month ago" },
  { name: "Joan P.", text: "I called with a question and Ana answered herself. Lovely small business.", when: "1 month ago" },
];

// Version B: the same product with conversion best practices applied.
export default function StoreB() {
  return (
    <div className="min-h-screen bg-[#fbf8f3] font-sans text-stone-800">
      <div className="bg-stone-900 py-2 text-center text-sm text-stone-100">
        Free shipping on orders over $45 · 30-day free returns · Handmade in Portland, OR
      </div>
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-10 py-4">
        <div className="text-2xl font-semibold tracking-tight">Hearth &amp; Kiln</div>
        <nav className="flex items-center gap-6 text-sm">
          <span>Mugs</span>
          <span>Bowls</span>
          <span>Our Studio</span>
          <span>Reviews</span>
          <span className="rounded-full bg-stone-900 px-3 py-1 text-white">Cart · 0</span>
        </nav>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-2 gap-14 px-10 py-10">
        <div>
          <Mug className="w-full rounded-2xl shadow-sm" />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {["#e9e2d6", "#cfd8d2", "#e6d3c3", "#d8d4e3"].map((g) => (
              <Mug key={g} glaze={g} className="rounded-lg border border-stone-200" />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-emerald-700">★★★★★ 4.9 · 212 reviews</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight">Speckled Stoneware Mug</h1>
          <p className="mt-1 text-lg text-stone-600">Hand-thrown 12 oz mug for coffee &amp; tea</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold">$38</span>
            <span className="text-sm text-stone-500">or 4 interest-free payments of $9.50</span>
          </div>
          <p className="mt-1 text-sm font-medium text-emerald-700">✓ Free shipping on 2+ mugs · ✓ Free 30-day returns</p>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            🚚 Order within <b>4 hrs 12 min</b> → arrives by <b>Mon, Nov 10</b>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded border border-stone-400" /> 🎁 Add gift wrap + handwritten note (+$4)
            </div>
          </div>

          <button className="mt-5 w-full rounded-xl bg-stone-900 py-4 text-lg font-semibold text-white">Add to cart · $38</button>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button className="rounded-xl bg-[#5a31f4] py-3 font-semibold text-white">Shop Pay</button>
            <button className="rounded-xl bg-black py-3 font-semibold text-white"> Pay</button>
          </div>
          <p className="mt-2 text-center text-xs text-stone-500">🔒 Secure checkout · Guest checkout available, no account needed</p>

          <ul className="mt-6 grid grid-cols-2 gap-2 text-sm text-stone-700">
            <li>📏 12 oz · 4.2&quot; tall · 3.4&quot; wide</li>
            <li>🔥 Microwave &amp; dishwasher safe</li>
            <li>🧪 Lead-free, food-safe glaze</li>
            <li>🏺 Wheel-thrown stoneware</li>
          </ul>
        </div>
      </main>

      <section className="mx-auto grid max-w-6xl grid-cols-3 gap-8 px-10 py-10">
        <div className="col-span-1 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Made by Ana, in a 2-person studio</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Every mug is thrown by hand on our wheel in Portland, glazed with our signature speckle and fired twice. No
            two are identical. We use locally sourced clay and ship in 100% plastic-free packaging.
          </p>
          <p className="mt-4 text-sm">
            Questions? Call us: <b>(503) 555-0142</b>
            <br />
            hello@hearthandkiln.com
          </p>
        </div>
        <div className="col-span-2">
          <h2 className="text-xl font-semibold">What customers say · ★ 4.9 (212)</h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.name} className="rounded-2xl bg-white p-5 text-sm shadow-sm">
                <p className="text-amber-500">★★★★★</p>
                <p className="mt-2 text-stone-700">&ldquo;{r.text}&rdquo;</p>
                <p className="mt-3 text-xs text-stone-500">
                  {r.name} · Verified buyer · {r.when}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mt-6 border-t border-stone-200 bg-white px-10 py-8 text-sm text-stone-500">
        Hearth &amp; Kiln · 2140 SE Division St, Portland, OR · (503) 555-0142 · Shipping &amp; Returns · Contact
      </footer>
    </div>
  );
}
