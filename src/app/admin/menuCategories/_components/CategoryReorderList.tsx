"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteItemComp2 } from "../../menuItems/_components/productsActions";
import { reorderCategories } from "../../_actions/products";

type Cat = { id: string; name: string; _count: { items: number } };

export default function CategoryReorderList({ categories }: { categories: Cat[] }) {
  const [items, setItems] = useState<Cat[]>(categories);
  const [pending, start] = useTransition();

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const prev = items;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    start(async () => {
      try {
        await reorderCategories(next.map((c) => c.id));
      } catch {
        setItems(prev); // revert on failure
        toast.error("Couldn't save the new order. Please try again.");
      }
    });
  };

  return (
    <div className="divide-y divide-stone-100">
      <div className="hidden sm:flex items-center gap-3 border-b border-stone-100 bg-stone-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
        <span className="w-16 shrink-0">Order</span>
        <span className="flex-1">Category</span>
        <span className="w-24 shrink-0">Items</span>
        <span className="w-10 shrink-0" />
      </div>

      {items.map((cate, i) => (
        <div
          key={cate.id}
          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-stone-50/70"
        >
          <div className="flex w-16 shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={`Move ${cate.name} up`}
              disabled={i === 0 || pending}
              onClick={() => move(i, -1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              aria-label={`Move ${cate.name} down`}
              disabled={i === items.length - 1 || pending}
              onClick={() => move(i, 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowDown size={15} />
            </button>
          </div>

          <p className="flex-1 font-medium text-stone-800">{cate.name}</p>

          <div className="w-24 shrink-0">
            <span className="inline-block rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
              {cate._count.items} item{cate._count.items === 1 ? "" : "s"}
            </span>
          </div>

          <div className="w-10 shrink-0 text-right">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
                <span className="sr-only">Actions</span>
                <MoreVertical size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DeleteItemComp2 id={cate.id} disabled={cate._count.items > 0} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
