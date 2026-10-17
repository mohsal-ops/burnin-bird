"use client";

import { useState, useTransition } from "react";
import { GripVertical, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteItemComp2 } from "../../menuItems/_components/productsActions";
import { reorderCategories } from "../../_actions/products";
import { useDragReorder } from "../../_components/useDragReorder";

type Cat = { id: string; name: string; _count: { items: number } };

export default function CategoryReorderList({ categories }: { categories: Cat[] }) {
  const [items, setItems] = useState<Cat[]>(categories);
  const [pending, start] = useTransition();

  const save = (next: Cat[]) => {
    const prev = items;
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
  // Grab the handle and drop the category where you want it (mouse or finger).
  const d = useDragReorder("categories", items, save);

  return (
    <div className="divide-y divide-stone-100">
      <div className="hidden sm:flex items-center gap-3 border-b border-stone-100 bg-stone-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
        <span className="w-10 shrink-0" />
        <span className="flex-1">Category {pending && <span className="ml-2 normal-case tracking-normal text-stone-400">Saving…</span>}</span>
        <span className="w-24 shrink-0">Items</span>
        <span className="w-10 shrink-0" />
      </div>

      {d.items.map((cate, i) => (
        <div
          key={cate.id}
          data-reorder="categories"
          data-reorder-index={i}
          className={`flex items-center gap-3 px-5 py-3 transition-[background-color,box-shadow] ${
            d.dragging === i ? "relative z-10 bg-white shadow-lg ring-2 ring-[#c85a1e]/40" : "hover:bg-stone-50/70"
          }`}
        >
          <button
            type="button"
            aria-label={`Drag to move ${cate.name}`}
            onPointerDown={d.grab(i)}
            className="flex h-9 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing"
          >
            <GripVertical size={18} />
          </button>

          <p className="flex-1 select-none font-medium text-stone-800">{cate.name}</p>

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
              <DropdownMenuContent align="end" className="admin-shell">
                <DeleteItemComp2 id={cate.id} disabled={cate._count.items > 0} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
