import { NextResponse } from "next/server";
import db from "@/db/db";
import { appApiOff } from "@/lib/app/guard";

export const dynamic = "force-dynamic";

// Menu for the native app: categories → available items → option groups.
export async function GET() {
  const off = await appApiOff();
  if (off) return off;
  const types = await db.types.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        where: { isAvailableForPurchase: true },
        orderBy: { name: "asc" },
        include: { sideGroups: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } } },
      },
    },
  });
  return NextResponse.json(
    {
      categories: types
        .filter((t) => t.items.length)
        .map((t) => ({
          id: t.id,
          name: t.name,
          items: t.items.map((i) => ({
            id: i.id,
            name: i.name,
            description: i.description,
            priceInCents: i.priceInCents,
            image: i.image,
            groups: i.sideGroups.map((g) => ({
              id: g.id,
              title: g.title,
              required: g.required,
              maxSelect: g.maxSelect,
              options: g.options.map((o) => ({ id: o.id, label: o.label, priceInCents: o.priceInCents })),
            })),
          })),
        })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
