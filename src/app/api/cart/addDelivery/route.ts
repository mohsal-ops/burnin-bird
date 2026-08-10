// app/api/cart/addDelivery/route.ts
import { NextResponse } from "next/server";
import { getOrCreateCart } from "@/lib/cart";
import db from "@/db/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const {
    address,
    lat,
    lng,
    placeId,
    apt,
    instructions,
    orderType,
    customerName,
    customerPhone
  } = await req.json();

  try {
    const cart = await getOrCreateCart();

    const existing = await db.cartItem.findFirst({
      where: { cartId: cart.id },
    });

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: {
          deliveryAddress: address,
          deliveryLat: lat,
          deliveryLng: lng,
          deliveryPlaceId: placeId,
          apt,
          instructions,
          orderType,
          customerName,
          customerPhone
        },
      });

      revalidatePath("cart");
      return NextResponse.json({ ok: true, message: "Delivery updated" });
    } else {
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          deliveryAddress: address,
          deliveryLat: lat,
          deliveryLng: lng,
          deliveryPlaceId: placeId,
          apt,
          instructions,
          orderType,
          customerName,
          customerPhone
        },
      });

      revalidatePath("cart");
      return NextResponse.json({ ok: true, message: "Delivery added" });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      ok: false,
      message: "Error while adding delivery",
    });
  }
}
