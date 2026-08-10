// app/api/cart/add/route.ts
import { NextResponse } from "next/server";
import { getOrCreateCart } from "@/lib/cart";
import db from "@/db/db";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const {
    image,
    productId,
    name,
    price,
    quantity,
    pickupTime,
    pickupDay,
    sides,
  } = await req.json();

  try {
    const cart = await getOrCreateCart();
    // Upsert item: if productId exists, increase qty
    const existing = await db.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });
    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { 
          quantity: existing.quantity + quantity,
          pickupDay,
          pickupTime,



         },
      });
      revalidateTag("cart")
      return NextResponse.json({
        ok: true,
        message: "this item already exists/updated",
      });
    } else {
      const cartItem = await db.cartItem.create({
        data: {
          image,
          pickupDay,
          pickupTime,
          productId,
          name,
          price,
          quantity,
          cart: { connect: { id: cart.id } },
        },
      });
      const optionIds = Object.values(sides ?? {}).flat() as string[];

      const sideOptions = await db.sideOption.findMany({
        where: { id: { in: optionIds } },
      })

      if (optionIds.length) {
        await db.cartItemSide.createMany({
          data: sideOptions.map((opt) => ({
            cartItemId: cartItem.id,
            sideGroupId: opt.sideGroupId,
            optionId: opt.id,
            label: opt.label,
            priceInCents: opt.priceInCents ?? null,
          })),
        });
      }
    }
    revalidateTag("cart");
    revalidatePath("/");
    return NextResponse.json({ ok: true, message: "added succefuly" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { ok: false, message: "error while adding product" },
      { status: 500 },
    );
  }
}
