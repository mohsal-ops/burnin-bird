import { Button } from "@/components/ui/button";
import PageHeader from "../_components/pageHeader";
import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import db from "@/db/db";
import { getSetting } from "@/lib/siteSettings";
import { applyCategoryOrder } from "@/lib/categoryOrder";
import CategoryReorderList from "./_components/CategoryReorderList";

export default async function Items() {
  const [rows, orderJson] = await Promise.all([
    db.types.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
    }),
    getSetting("category_order", "[]"),
  ]);
  const categories = applyCategoryOrder(rows, orderJson);

  return (
    <div className="lg:flex justify-center">
      <div className="w-full lg:w-[80%] p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <PageHeader>Menu Categories</PageHeader>
            <p className="mt-1 text-sm text-stone-500">
              {categories.length} categor{categories.length === 1 ? "y" : "ies"} · use the arrows to set the order shown on your site
            </p>
          </div>
          <Link href="/admin/menuCategories/new">
            <Button variant="mainButton" size="md" className="gap-1.5">
              <Plus size={16} /> Add category
            </Button>
          </Link>
        </div>

        {/* Table card */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {categories.length > 0 ? (
            <CategoryReorderList categories={categories} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <Tag size={22} />
              </div>
              <div>
                <p className="font-semibold text-stone-800">No categories yet</p>
                <p className="mt-1 text-sm text-stone-500">
                  Categories group your menu items (e.g. Pizzas, Pastas, Drinks).
                </p>
              </div>
              <Link href="/admin/menuCategories/new">
                <Button variant="mainButton" size="md" className="gap-1.5">
                  <Plus size={16} /> Add category
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
