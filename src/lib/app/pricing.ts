// Pure: price an app cart line from the restaurant's own menu data. The app's
// prices are never trusted. Enforces the same modifier rules as the website:
// options must belong to the item, required groups need a pick, maxSelect caps.

export interface PriceItem {
  id: string;
  name: string;
  priceInCents: number;
  isAvailableForPurchase: boolean;
  sideGroups: {
    id: string;
    title: string;
    required: boolean;
    maxSelect: number | null;
    options: { id: string; label: string; priceInCents: number | null }[];
  }[];
}

export type PricedLine = {
  productId: string;
  name: string;
  quantity: number;
  unitCents: number;
  sides: { sideGroupId: string; optionId: string; label: string; priceInCents: number | null }[];
};

export function priceLine(item: PriceItem | undefined, quantity: number, optionIds: string[]): PricedLine | { error: string } {
  if (!item || !item.isAvailableForPurchase) return { error: "An item in your order is no longer available." };
  const q = Math.floor(quantity);
  if (!(q >= 1 && q <= 50)) return { error: "Quantity must be between 1 and 50." };
  const wanted = new Set(optionIds);
  const sides: PricedLine["sides"] = [];
  for (const g of item.sideGroups) {
    const picked = g.options.filter((o) => wanted.has(o.id));
    if (g.required && picked.length === 0) return { error: `Please choose: ${g.title} (${item.name}).` };
    if (g.maxSelect && picked.length > g.maxSelect) return { error: `Too many choices for ${g.title}.` };
    for (const o of picked) {
      sides.push({ sideGroupId: g.id, optionId: o.id, label: o.label, priceInCents: o.priceInCents });
      wanted.delete(o.id);
    }
  }
  if (wanted.size) return { error: "Some choices don't match this item. Please refresh the menu." };
  const unitCents = item.priceInCents + sides.reduce((s, x) => s + (x.priceInCents ?? 0), 0);
  return { productId: item.id, name: item.name, quantity: q, unitCents, sides };
}
