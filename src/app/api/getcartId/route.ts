// app/api/getcartId/route.ts
import { getOrCreateCart } from "@/lib/cart";
import { NextResponse } from "next/server";

// Creating the cart eagerly here (called once on mount by CartProvider) instead of
// lazily inside /api/cart/add means the cart+cookie usually already exist by the
// time the user clicks "Add to Cart", cutting down on the window for duplicate
// carts from rapid concurrent add requests.
export async function GET() {
  const cart = await getOrCreateCart();
  return NextResponse.json({ cartId: cart.id });
}

