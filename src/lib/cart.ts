// lib/cart.ts (server)
import { cookies } from "next/headers";
import db from "@/db/db"; // prisma client

async function createCartAndSetCookie() {
  const cookieStore = await cookies();
  const cart = await db.cart.create({ data: {} });
  cookieStore.set({
    name: "cart_id",
    value: cart.id,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return cart;
}

// Returns the session's active (status "open") cart, creating one if none exists yet.
// If the cookie points at a cart that's missing or already completed/abandoned
// (e.g. checkout finished, or the cleanup job archived it), a fresh cart is started
// instead of silently appending new items to a closed order.
export async function getOrCreateCart() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cart_id")?.value;

  if (!cartId) {
    return createCartAndSetCookie();
  }

  const cart = await db.cart.findUnique({ where: { id: cartId } });
  if (!cart || cart.status !== "open") {
    return createCartAndSetCookie();
  }
  return cart;
}
