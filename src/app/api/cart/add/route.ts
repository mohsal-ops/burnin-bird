// app/api/cart/add/route.ts
import { NextResponse } from "next/server";
import { getOrCreateCart } from "@/lib/cart";
import db from "@/db/db";
import { revalidatePath, revalidateTag } from "next/cache";

// Snapshot the chosen modifier options onto a cart item (price + label frozen at
// add time). `sides` is a { groupId: optionId[] } map from the modal.
async function writeSides(cartItemId: string, sides: unknown) {
  const optionIds = Object.values((sides as Record<string, string[]>) ?? {}).flat();
  if (!optionIds.length) return;
  const sideOptions = await db.sideOption.findMany({ where: { id: { in: optionIds } } });
  if (!sideOptions.length) return;
  await db.cartItemSide.createMany({
    data: sideOptions.map((opt) => ({
      cartItemId,
      sideGroupId: opt.sideGroupId,
      optionId: opt.id,
      label: opt.label,
      priceInCents: opt.priceInCents ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const { image, productId, name, price, quantity, pickupTime, pickupDay, sides } =
    await req.json();

  try {
    const cart = await getOrCreateCart();
    // Same product already in the cart → bump qty, and refresh its modifiers +
    // price to the latest selection so a re-add never silently drops them.
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
          price,
        },
      });
      await db.cartItemSide.deleteMany({ where: { cartItemId: existing.id } });
      await writeSides(existing.id, sides);
      revalidateTag("cart");
      revalidatePath("/");
      return NextResponse.json({ ok: true, message: "Cart updated" });
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
      await writeSides(cartItem.id, sides);
    }
    revalidateTag("cart");
    revalidatePath("/");
    return NextResponse.json({ ok: true, message: "Added to cart" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { ok: false, message: "error while adding product" },
      { status: 500 },
    );
  }
}
