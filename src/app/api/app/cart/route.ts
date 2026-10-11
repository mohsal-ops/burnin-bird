import { NextResponse } from "next/server";
import db from "@/db/db";
import { appApiOff } from "@/lib/app/guard";
import { priceLine, type PricedLine } from "@/lib/app/pricing";
import { SITE_CONFIG } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

// The native app sends its cart here. We re-price every line from our own DB,
// create a normal Cart (pickup), and hand back the site's own checkout URL, so
// payment, finalizeCart, alerts, POS push etc. all run exactly as on the web.
type Body = {
  items?: { productId?: string; quantity?: number; optionIds?: string[] }[];
  customerName?: string;
  customerPhone?: string;
};

export async function POST(req: Request) {
  const off = await appApiOff();
  if (off) return off;
  const b = (await req.json().catch(() => ({}))) as Body;
  const lines = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
  const name = (b.customerName ?? "").trim().slice(0, 80);
  const phone = (b.customerPhone ?? "").trim().slice(0, 30);
  if (!lines.length) return NextResponse.json({ error: "Your order is empty." }, { status: 400 });
  if (!name || phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });

  const ids = [...new Set(lines.map((l) => String(l.productId ?? "")))];
  const items = await db.item.findMany({
    where: { id: { in: ids } },
    include: { sideGroups: { include: { options: true } } },
  });
  const byId = new Map(items.map((i) => [i.id, i]));
  const priced: PricedLine[] = [];
  for (const l of lines) {
    const it = byId.get(String(l.productId ?? ""));
    const r = priceLine(
      it && {
        id: it.id,
        name: it.name,
        priceInCents: it.priceInCents,
        isAvailableForPurchase: it.isAvailableForPurchase,
        sideGroups: it.sideGroups.map((g) => ({
          id: g.id,
          title: g.title,
          required: g.required,
          maxSelect: g.maxSelect,
          options: g.options.map((o) => ({ id: o.id, label: o.label, priceInCents: o.priceInCents })),
        })),
      },
      Number(l.quantity ?? 1),
      Array.isArray(l.optionIds) ? l.optionIds.map(String) : [],
    );
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
    priced.push(r);
  }

  const images = new Map(items.map((i) => [i.id, i.image]));
  const cart = await db.cart.create({ data: { status: "open" } });
  for (const p of priced) {
    const ci = await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: p.productId,
        name: p.name,
        price: p.unitCents,
        quantity: p.quantity,
        image: images.get(p.productId) ?? null,
        orderType: "pickup",
        pickupDay: new Date(),
        pickupTime: "ASAP",
        customerName: name,
        customerPhone: phone,
      },
    });
    if (p.sides.length) await db.cartItemSide.createMany({ data: p.sides.map((s) => ({ ...s, cartItemId: ci.id })) });
  }
  return NextResponse.json({
    cartId: cart.id,
    checkoutUrl: `${SITE_CONFIG.siteUrl}/Menu/${cart.id}/purchase?source=app`,
    totalCents: priced.reduce((s, p) => s + p.unitCents * p.quantity, 0),
  });
}
