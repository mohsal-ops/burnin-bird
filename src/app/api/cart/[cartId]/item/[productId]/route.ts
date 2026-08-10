import db from "@/db/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, context: { params: Promise<{ cartId: string; productId: string }> }) {
  const { cartId, productId } = await context.params;


  try {
    await db.cartItem.deleteMany({
      where: {
        cartId,
        id: productId,
      },
    })
    revalidatePath('cart')
    revalidateTag('cart')
    return new Response("Item deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Delete error:", error);
    return new Response("Failed to delete item", { status: 500 });
  }
}

// Persists cart sidebar quantity +/- clicks to the DB so a refresh doesn't revert them.
export async function PATCH(req: Request, context: { params: Promise<{ cartId: string; productId: string }> }) {
  const { cartId, productId } = await context.params;
  const { quantity } = await req.json();

  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ ok: false, message: "Invalid quantity" }, { status: 400 });
  }

  try {
    const result = await db.cartItem.updateMany({
      where: { cartId, id: productId },
      data: { quantity },
    });

    if (result.count === 0) {
      return NextResponse.json({ ok: false, message: "Item not found" }, { status: 404 });
    }

    revalidatePath('cart');
    revalidateTag('cart');
    return NextResponse.json({ ok: true, message: "Quantity updated" });
  } catch (error) {
    console.error("Quantity update error:", error);
    return NextResponse.json({ ok: false, message: "Failed to update quantity" }, { status: 500 });
  }
}

