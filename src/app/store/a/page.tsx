import type { Metadata } from "next";
import { Mug } from "../Mug";

export const metadata: Metadata = { title: "Mug - Speckled | Hearth & Kiln" };

// Version A: a typical small-business product page with common conversion problems.
export default function StoreA() {
  return (
    <div className="min-h-screen bg-white font-serif text-neutral-700">
      <div className="bg-neutral-800 py-1 text-center text-[11px] text-neutral-300">Welcome to our shop!!</div>
      <header className="flex items-center justify-between border-b px-10 py-5">
        <div className="text-2xl italic tracking-wide text-neutral-800">Hearth &amp; Kiln</div>
        <nav className="flex gap-6 text-sm text-neutral-500">
          <span>Home</span>
          <span>Shop</span>
          <span>Blog</span>
          <span>Account</span>
          <span>Cart (0)</span>
        </nav>
      </header>

      <div className="relative overflow-hidden bg-[#d9cdb8] px-10 py-24 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-600">New Collection</p>
        <h1 className="mt-3 text-5xl italic text-neutral-800">Simple. Beautiful. Ours.</h1>
        <p className="mt-3 text-neutral-600">Discover the collection</p>
        <div className="mt-6 flex justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-neutral-700" />
          <span className="h-2 w-2 rounded-full bg-neutral-400" />
          <span className="h-2 w-2 rounded-full bg-neutral-400" />
        </div>
      </div>

      <main className="mx-auto grid max-w-5xl grid-cols-2 gap-12 px-10 py-14">
        <div>
          <Mug className="w-full max-w-sm rounded" />
          <div className="mt-3 flex gap-2">
            <div className="h-14 w-14 rounded bg-neutral-200" />
            <div className="h-14 w-14 rounded bg-neutral-200" />
          </div>
        </div>
        <div className="pt-4">
          <p className="text-xs text-neutral-400">Home / Shop / Mugs</p>
          <h2 className="mt-2 text-2xl text-neutral-800">Mug - Speckled (12oz)</h2>
          <p className="mt-2 text-sm text-neutral-400">$38.00 USD</p>
          <p className="text-xs text-neutral-400">Tax included. Shipping calculated at checkout.</p>
          <p className="mt-2 text-xs text-neutral-400">☆☆☆☆☆ No reviews yet</p>

          <p className="mt-6 text-sm leading-relaxed">
            Our mugs are great. Perfect for coffee or tea or anything else you like. Each one is a little different.
            Order now!
          </p>

          <div className="mt-6 text-sm">
            <label className="text-xs text-neutral-500">Quantity</label>
            <div className="mt-1 flex w-28 items-center justify-between border px-3 py-1">
              <span>-</span>
              <span>1</span>
              <span>+</span>
            </div>
          </div>
          <button className="mt-6 w-40 border border-neutral-300 bg-neutral-100 py-2 text-xs uppercase tracking-widest text-neutral-500">
            Add
          </button>
          <p className="mt-3 text-[11px] text-neutral-400">* Please create an account to complete checkout.</p>
        </div>
      </main>

      <section className="mx-auto max-w-5xl px-10 pb-16">
        <h3 className="text-lg text-neutral-800">You may also like</h3>
        <div className="mt-4 grid grid-cols-4 gap-4">
          {["Bowl", "Plate", "Vase", "Tumbler"].map((n) => (
            <div key={n}>
              <div className="aspect-square bg-neutral-100" />
              <p className="mt-2 text-xs">{n}</p>
              <p className="text-xs text-neutral-400">From $24</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t px-10 py-8 text-xs text-neutral-400">© Hearth &amp; Kiln. All rights reserved.</footer>

      <div className="fixed bottom-6 right-6 w-80 rounded border bg-white p-5 shadow-xl">
        <div className="flex justify-between">
          <p className="text-sm font-semibold text-neutral-800">Join our newsletter!</p>
          <span className="text-neutral-400">✕</span>
        </div>
        <p className="mt-1 text-xs">Sign up for updates, news and more.</p>
        <div className="mt-3 border px-2 py-1 text-xs text-neutral-400">Email address</div>
        <div className="mt-2 bg-neutral-800 py-1 text-center text-xs text-white">Subscribe</div>
      </div>
    </div>
  );
}
