"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { CartItem } from "generated/prisma";

// Shared cart plumbing for the bespoke theme navbars (same calls as the default
// TopNavBar): resolve the cart id, then fetch its items.
const fetcher = async (url: string, cartId: string | null) => {
  const res = await fetch(url, { headers: { "Content-Type": "application/json", "x-cart-id": cartId ?? "" } });
  return res.json();
};

export function useNavCart(initialCartId: string | null) {
  const [cartId, setCartId] = useState<string | null>(initialCartId);
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/getcartId");
      const data = await res.json().catch(() => ({}));
      if (data?.cartId) setCartId(data.cartId);
    })();
  }, []);
  const { data } = useSWR(cartId ? ["/api/cart/get", cartId] : null, ([url, id]) => fetcher(url, id), { revalidateOnFocus: false });
  return { cartId, cartItems: (data?.cart?.items ?? []) as CartItem[] };
}

// Every theme: the cart lives on the menu page; anywhere else it only appears
// once something is in it (no empty basket cluttering the nav).
export function shouldShowCart(pathname: string, itemCount: number) {
  return pathname.toLowerCase().startsWith("/menu") || itemCount > 0;
}
