"use client";

import { CartItem } from "generated/prisma";
import { useCart } from "@/app/providers/CartProvider";

// Every navbar reads the ONE shared cart from CartProvider. Navbars used to
// resolve their own cart id + SWR key; on a first visit that raced the provider
// (two /api/getcartId calls -> two carts), so "Add to cart" refreshed one cart
// while the nav showed the other. `_initialCartId` is kept for call-site compat.
export function useNavCart(_initialCartId?: string | null) {
  const { cartId, cartItems } = useCart();
  return { cartId, cartItems: cartItems as CartItem[] };
}

// The cart button only appears once something is in it - never an empty
// "0 items" pill, on any page.
export function shouldShowCart(_pathname: string, itemCount: number) {
  return itemCount > 0;
}
