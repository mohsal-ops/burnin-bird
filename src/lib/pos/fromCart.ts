import type { PosOrderInput } from "./types";

// Pure: turn a paid Cart (as loaded in finalizeCart) into a provider-neutral
// POS order. Mirrors the checkout math in Menu/[id]/purchase/page.tsx exactly:
//   total = max(0, Σ price×qty − promo discount) + delivery fee
// where CartItem.price is the unit price WITH modifiers already included
// (schedualePickupModal: finalPrice = product price + sides).

export interface CartForPos {
  id: string;
  uberFeeCents: number | null;
  items: {
    name: string | null;
    price: number | null;
    quantity: number | null;
    orderType: string | null;
    pickupDay: Date | null;
    pickupTime: string | null;
    deliveryAddress: string | null;
    apt: string | null;
    instructions: string | null;
    customerName: string | null;
    customerPhone: string | null;
    sides: { label: string; priceInCents: number | null }[];
  }[];
}

/** Offset (ms) of `tz` from UTC at instant `t`. */
function tzOffset(t: number, tz: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(t)).map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - (t - (t % 1000));
}

/**
 * "6:30 PM" / "18:30" on the customer's chosen day, in the RESTAURANT's
 * timezone → ISO instant. undefined if unparseable or already in the past
 * (→ the POS treats it as ASAP).
 */
export function pickupIso(day: Date | null, time: string | null, tz: string, now = new Date()): string | undefined {
  if (!day || !time) return undefined;
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!m) return undefined;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return undefined;
  // Calendar date of the chosen day as seen in the restaurant's timezone.
  const [y, mo, d] = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(day)
    .split("-")
    .map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, min);
  let t = wall - tzOffset(wall, tz);
  t = wall - tzOffset(t, tz); // second pass handles DST edges
  return t < now.getTime() - 5 * 60_000 ? undefined : new Date(t).toISOString();
}

export function cartToPosOrder(
  cart: CartForPos,
  opts: { email?: string; discountPercent?: number; isDelivery: boolean; timezone: string; now?: Date },
): PosOrderInput {
  const first = cart.items[0];
  const lines = cart.items
    .filter((it) => it.name)
    .map((it) => ({
      name: it.name as string,
      quantity: Math.max(1, it.quantity ?? 1),
      unitPriceCents: it.price ?? 0,
      modifiers: it.sides.map((s) => ({ name: s.label, priceCents: s.priceInCents ?? 0 })),
    }));
  const itemsTotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const discountCents = opts.discountPercent ? Math.round((itemsTotal * opts.discountPercent) / 100) : 0;
  const deliveryFeeCents = opts.isDelivery ? cart.uberFeeCents ?? 0 : 0;
  const note = [first?.apt ? `Apt/Suite: ${first.apt}` : "", first?.instructions ?? ""].filter(Boolean).join(" — ");

  return {
    externalId: cart.id,
    lines,
    customer: {
      name: first?.customerName ?? undefined,
      phone: first?.customerPhone ?? undefined,
      email: opts.email && opts.email !== "N/A" ? opts.email : undefined,
    },
    fulfillment: {
      type: opts.isDelivery ? "delivery" : "pickup",
      timezone: opts.timezone,
      pickupAt: opts.isDelivery ? undefined : pickupIso(first?.pickupDay ?? null, first?.pickupTime ?? null, opts.timezone, opts.now),
      deliveryAddress: opts.isDelivery ? first?.deliveryAddress ?? undefined : undefined,
      note: note || undefined,
    },
    discountCents,
    deliveryFeeCents,
    tipCents: 0, // checkout has no tip today
    totalCents: Math.max(0, itemsTotal - discountCents) + deliveryFeeCents,
  };
}
