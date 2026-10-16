"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Star, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { reorderFeatured } from "../../_actions/products";

type Feat = { id: string; name: string; image: string | null };

// The order featured items appear on the website. #1 is the big card on the
// homepage; use the arrows to move a dish. Saves instantly.
export default function FeaturedOrder({ items: initial }: { items: Feat[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  if (items.length < 2) return null;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const prev = items;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    start(async () => {
      try {
        await reorderFeatured(next.map((x) => x.id));
      } catch {
        setItems(prev);
        toast.error("Couldn't save the new order. Please try again.");
      }
    });
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-stone-900">
          <Star size={16} className="fill-amber-400 text-amber-400" /> Featured order
        </h2>
        <p className="text-xs text-stone-500">
          {pending ? "Saving…" : "#1 is the big card on your homepage. Use the arrows to reorder."}
        </p>
      </div>
      <ol className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {items.map((it, i) => (
          <li key={it.id} className="w-36 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
            <div className="relative aspect-square bg-stone-100">
              {it.image ? (
                <Image src={it.image} alt={it.name} fill sizes="144px" className="object-cover" />
              ) : (
                <UtensilsCrossed className="absolute inset-0 m-auto h-8 w-8 text-stone-300" />
              )}
              <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-stone-900 text-xs font-bold text-white">
                {i + 1}
              </span>
            </div>
            <p className="truncate px-2.5 pt-2 text-sm font-medium text-stone-800">{it.name}</p>
            <div className="flex justify-between px-1.5 pb-1.5 pt-1">
              <button
                type="button"
                aria-label={`Move ${it.name} earlier`}
                disabled={i === 0 || pending}
                onClick={() => move(i, -1)}
                className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-stone-200 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                aria-label={`Move ${it.name} later`}
                disabled={i === items.length - 1 || pending}
                onClick={() => move(i, 1)}
                className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-stone-200 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
