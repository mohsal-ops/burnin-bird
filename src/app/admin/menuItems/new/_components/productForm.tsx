"use client";

import AddProduct, { updateProduct } from "@/app/admin/_actions/products";
import PageHeader from "@/app/admin/_components/pageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";
import { Label } from "@radix-ui/react-label";
import { Item } from "generated/prisma";
import { Plus, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

const initialState = { message: "" };

export default function ProductForm({
  item,
  types,
}: {
  item: Item | null;
  types: any[] | undefined[];
}) {
  const [state, formAction, pending] = useActionState(
    item == null ? AddProduct : updateProduct.bind(null, item.id),
    initialState,
  );
  const [categoryId, setCategoryId] = useState<string>(item?.typeId || "");
  const [price, setPrice] = useState<string>(item ? (item.priceInCents / 100).toFixed(2) : "");
  const [isCaterable, setIsCaterable] = useState<boolean>(item?.isCaterable ?? false);
  const [preview, setPreview] = useState<string | null>(item?.image || null);
  const hiddenCategoryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hiddenCategoryRef.current) hiddenCategoryRef.current.value = categoryId;
  }, [categoryId]);

  useEffect(() => {
    if (!state) return;
    const s = state as any;
    if (s.message) {
      const ok = /added|success|updated/i.test(String(s.message));
      if (ok) toast.success(s.message);
      else toast.error(s.message);
    } else if (s.error) {
      toast.error("Please check the highlighted fields and try again.");
    }
  }, [state]);

  const card = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4";
  const label = "text-sm font-medium text-stone-700";

  return (
    <div className="lg:flex justify-center pb-16">
      <form action={formAction} className="w-full lg:w-[80%] space-y-5">
        <PageHeader>{item ? "Edit item" : "New menu item"}</PageHeader>

        {/* Basics */}
        <div className={card}>
          <div className="space-y-1.5">
            <Label htmlFor="name" className={label}>Name</Label>
            <Input type="text" required id="name" name="name" defaultValue={item?.name} placeholder="e.g. Brisket Plate" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className={label}>Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={item?.description || ""} placeholder="Short description shown on the menu" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price" className={label}>Price</Label>
            <div className="relative w-40">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                id="price"
                name="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
            {price && Number(price) > 0 ? (
              <p className="text-xs text-stone-500">
                Customers pay <span className="font-semibold text-stone-700">{formatCurrency(Number(price))}</span>
              </p>
            ) : (
              <p className="text-xs text-stone-400">In dollars — e.g. 12.99</p>
            )}
          </div>
        </div>

        {/* Photo + category */}
        <div className={card}>
          <div className="space-y-1.5">
            <Label className={label}>Photo</Label>
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="text-stone-300" />
                )}
              </div>
              <Input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                className="max-w-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setPreview(f ? URL.createObjectURL(f) : item?.image || null);
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={label}>Category</Label>
            <Select value={categoryId || undefined} onValueChange={(v) => setCategoryId(v)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {types && types.length > 0 ? (
                  types.map((type: any) => (
                    <SelectItem key={type.id} value={type.id} className="hover:cursor-pointer">
                      {type.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-stone-400">No categories yet</div>
                )}
              </SelectContent>
            </Select>
            <Link href="/admin/menuCategories/new" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:underline">
              <Plus className="w-4" /> add category
            </Link>
            <input type="hidden" id="category" name="category" ref={hiddenCategoryRef} defaultValue={item?.typeId || ""} />
          </div>
        </div>

        {/* Catering */}
        <div className={card}>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              name="isCaterable"
              checked={isCaterable}
              value="true"
              onChange={(e) => setIsCaterable(e.target.checked)}
              className="h-4 w-4"
            />
            Available for catering
          </label>

          {isCaterable && (
            <div className="space-y-4 border-t border-stone-100 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="cateringDescription" className={label}>Catering description</Label>
                <Textarea id="cateringDescription" name="cateringDescription" rows={2} defaultValue={item?.cateringDescription || ""} placeholder="How it's served for catering (tray size, serves N…)" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cateringPrice" className={label}>Catering price</Label>
                <div className="relative w-40">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    id="cateringPrice"
                    name="cateringPrice"
                    defaultValue={item?.cateringPriceInCents ? (item.cateringPriceInCents / 100).toFixed(2) : ""}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="mainButton" size="md" disabled={pending || !categoryId} type="submit">
            {pending ? "Saving…" : item ? "Save changes" : "Add item"}
          </Button>
          <Link href="/admin/menuItems">
            <Button type="button" variant="outline" size="md">Back to items</Button>
          </Link>
          {!categoryId && <span className="text-xs text-stone-400">Pick a category to save.</span>}
        </div>
      </form>
    </div>
  );
}
