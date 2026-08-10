"use client";

import { AddCategory } from "@/app/admin/_actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@radix-ui/react-label";
import { Item } from "generated/prisma";
import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";

const initialState = {
  message: "",
};

export default function ProductForm({ item }: { item: Item | null }) {
  const [state, formAction, pending] = useActionState(AddCategory, initialState);

  useEffect(() => {
    const s = state as any;
    const msg = s?.message ?? (s?.error ? "Please enter a valid category name." : "");
    if (!msg) return;
    if (/added|success|updated/i.test(msg)) toast.success(msg);
    else toast.error(msg);
  }, [state]);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#c85a1e]">
          <Tag size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-stone-900">New category</h2>
          <p className="text-sm text-stone-500">
            Group your menu items — e.g. Pizzas, Pastas, Drinks.
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-stone-700">
            Category name
          </Label>
          <Input
            type="text"
            required
            id="name"
            name="name"
            autoFocus
            defaultValue={item?.name}
            placeholder="e.g. Appetizers"
            className="h-11"
          />
          <p className="text-xs text-stone-400">
            This is how the section appears on your public menu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button variant="mainButton" size="md" disabled={pending} type="submit">
            {pending ? "Saving…" : "Add category"}
          </Button>
          <Link href="/admin/menuCategories">
            <Button type="button" variant="outline" size="md">
              Back to categories
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
