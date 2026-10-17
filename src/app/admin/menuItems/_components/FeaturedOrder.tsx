"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { GripVertical, Star, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { reorderFeatured } from "../../_actions/products";
import { useDragReorder } from "../../_components/useDragReorder";

type Feat = { id: string; name: string; image: string | null };

// The order featured items appear on the website. #1 is the big card on the
// homepage. Grab a dish and drop it where you want it - saves instantly.
export default function FeaturedOrder({ items: initial }: { items: Feat[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const save = (next: Feat[]) => {
    const prev = items;
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
  const d = useDragReorder("featured", items, save);
  if (items.length < 2) return null;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-stone-900">
          <Star size={16} className="fill-amber-400 text-amber-400" /> Featured order
        </h2>
        <p className="text-xs text-stone-500">
          {pending ? "Saving…" : "Drag a dish to move it. #1 is the big card on your homepage."}
        </p>
      </div>
      <ol className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {d.items.map((it, i) => (
          <li
            key={it.id}
            data-reorder="featured"
            data-reorder-index={i}
            onPointerDown={d.grab(i)}
            className={`cursor-grab touch-none select-none overflow-hidden rounded-xl border bg-stone-50 transition-[transform,box-shadow] duration-150 active:cursor-grabbing ${
              d.dragging === i ? "relative z-10 scale-105 border-[#c85a1e] shadow-xl ring-2 ring-[#c85a1e]/40" : "border-stone-200"
            }`}
          >
            <div className="relative aspect-square bg-stone-100">
              {it.image ? (
                <Image src={it.image} alt={it.name} fill sizes="160px" draggable={false} className="pointer-events-none object-cover" />
              ) : (
                <UtensilsCrossed className="absolute inset-0 m-auto h-8 w-8 text-stone-300" />
              )}
              <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-stone-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-stone-500 shadow-sm">
                <GripVertical size={15} />
              </span>
            </div>
            <p className="truncate px-2.5 py-2 text-sm font-medium text-stone-800">{it.name}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
