"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import useSWR, { KeyedMutator } from "swr";

interface CartContextType {
  cartItems: any[];
  cartId: string | null;
  mutate: KeyedMutator<any>;
}

// Create context with correct type
const CartContext = createContext<CartContextType | null>(null);

const fetcher = async (url: string, cartId: string | null) => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "x-cart-id": cartId ?? "",
    },
  });
  return res.json();
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);

  // ✅ fetch cart ID only once on mount
  useEffect(() => {
    const fetchCartId = async () => {
      try {
        const res = await fetch("/api/getcartId");
        const data = await res.json();
        setCartId(data.cartId);
      } catch (err) {
        console.error("Failed to fetch cart ID:", err);
      }
    };

    fetchCartId();
  }, []); // <-- runs only once

  // ✅ useSWR only runs when cartId is available
  const { data: CartResObj, mutate } = useSWR(
    cartId ? ["/api/cart/get", cartId] : null,
    ([url, id]) => fetcher(url, id),
    { revalidateOnFocus: false }
  );

  const cartItems = CartResObj?.cart?.items ?? [];

  return (
    <CartContext.Provider value={{ cartItems, cartId, mutate }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
