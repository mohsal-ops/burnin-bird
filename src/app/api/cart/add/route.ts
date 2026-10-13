// app/api/cart/add/route.ts
import { NextResponse } from "next/server";
import { getOrCreateCart } from "@/lib/cart";
import db from "@/db/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { priceLine } from "@/lib/app/pricing";

// Add an item to the cart. SECURITY: price, name and modifier prices always come
// from the restaurant's own menu in the DB (lib/app/pricing.priceLine) - never
// from the request - so nobody can set their own price or a negative quantity.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const productId = String(body.productId ?? "");
  const pickupDay = typeof body.pickupDay === "string" ? body.pickupDay.slice(0, 40) : undefined;
  const pickupTime = typeof body.pickupTime === "string" ? body.pickupTime.slice(0, 40) : undefined;
  const optionIds = Object.values((body.sides as Record<string, unknown>) ?? {})
    .flat()
    .filter((v): v is string => typeof v === "string");

  try {
    const item = await db.item.findUnique({
      where: { id: productId },
      include: { sideGroups: { include: { options: true } } },
    });
    const priced = priceLine(
      item
        ? {
            id: item.id,
            name: item.name,
            priceInCents: item.priceInCents,
            isAvailableForPurchase: item.isAvailableForPurchase,
            sideGroups: item.sideGroups.map((g) => ({
              id: g.id,
              title: g.title,
              required: g.required,
              maxSelect: g.maxSelect,
              options: g.options.map((o) => ({ id: o.id, label: o.label, priceInCents: o.priceInCents })),
            })),
          }
        : undefined,
      Number(body.quantity ?? 1),
      optionIds,
    );
    if ("error" in priced) return NextResponse.json({ ok: false, message: priced.error }, { status: 400 });

    const cart = await getOrCreateCart();
    // Same product already in the cart → bump qty and refresh its modifiers +
    // price to the latest selection so a re-add never silently drops them.
    const existing = await db.cartItem.findFirst({ where: { cartId: cart.id, productId } });
    const writeSides = (cartItemId: string) =>
      priced.sides.length
        ? db.cartItemSide.createMany({ data: priced.sides.map((s) => ({ ...s, cartItemId })) })
        : Promise.resolve();

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: Math.min((existing.quantity ?? 0) + priced.quantity, 50),
          pickupDay,
          pickupTime,
          price: priced.unitCents,
        },
      });
      await db.cartItemSide.deleteMany({ where: { cartItemId: existing.id } });
      await writeSides(existing.id);
      revalidateTag("cart");
      revalidatePath("/");
      return NextResponse.json({ ok: true, message: "Cart updated" });
    }

    const cartItem = await db.cartItem.create({
      data: {
        image: item?.image ?? null,
        pickupDay,
        pickupTime,
        productId,
        name: priced.name,
        price: priced.unitCents,
        quantity: priced.quantity,
        cart: { connect: { id: cart.id } },
      },
    });
    await writeSides(cartItem.id);
    revalidateTag("cart");
    revalidatePath("/");
    return NextResponse.json({ ok: true, message: "Added to cart" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ ok: false, message: "error while adding product" }, { status: 500 });
  }
}
