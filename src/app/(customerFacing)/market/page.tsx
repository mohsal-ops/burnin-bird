import type { Metadata } from "next";
import { notFound } from "next/navigation";
import db from "@/db/db";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getOutreach } from "@/lib/outreach";
import { MARKET_CATEGORY, animalOf, isCutGroup, isWeightGroup, lbOf, type MarketCut } from "@/lib/market";
import { MarketClient } from "./MarketClient";

export const metadata: Metadata = {
  title: "Meat Market",
  description: `Fresh cuts by the pound from ${SITE_CONFIG.name}. Order ahead for pickup or delivery.`,
};

// Cached (ISR) like the other pages; menu edits revalidate it.
export const revalidate = 300;

// The Butcher counter: raw cuts by the pound + ready-made boxes, from the menu
// category named "Meat Market" / "Butcher" (see lib/market.ts).
export default async function MarketPage() {
  const types = await db.types.findMany({ select: { id: true, name: true } });
  const ids = types.filter((t) => MARKET_CATEGORY.test(t.name)).map((t) => t.id);
  if (!ids.length) notFound();

  const items = await db.item.findMany({
    where: { typeId: { in: ids }, isAvailableForPurchase: true },
    include: { sideGroups: { include: { options: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    orderBy: { priceInCents: "asc" },
  });
  if (!items.length) notFound();

  const cuts: MarketCut[] = items.map((it) => {
    const opt = (o: { id: string; label: string; priceInCents: number | null }) => ({ id: o.id, label: o.label, priceInCents: o.priceInCents ?? 0, lb: lbOf(o.label) });
    const w = it.sideGroups.find((g) => isWeightGroup(g.title));
    const s = it.sideGroups.find((g) => g !== w && isCutGroup(g.title));
    return {
      id: it.id,
      name: it.name,
      description: it.description,
      image: it.image,
      pricePerLbCents: it.priceInCents,
      animal: animalOf(it.name, it.description ?? ""),
      weight: w ? { groupId: w.id, options: w.options.map(opt) } : null,
      style: s ? { groupId: s.id, title: s.title, options: s.options.map(opt) } : null,
      extraRequired: it.sideGroups.some((g) => g !== w && g !== s && g.required),
    };
  });

  // The butcher's showpieces first (lamb, goat, beef...), cheapest last within each.
  const rank = (a: string) => { const i = ["Lamb", "Goat", "Beef", "Veal", "Chicken", "Turkey", "Fish"].indexOf(a); return i < 0 ? 99 : i; };
  cuts.sort((a, b) => rank(a.animal) - rank(b.animal) || b.pricePerLbCents - a.pricePerLbCents);

  return <MarketClient cuts={cuts} name={SITE_CONFIG.name} halal={(SITE_CONFIG.cuisines ?? []).some((c) => /halal/i.test(c))} preview={getOutreach().enabled} />;
}
