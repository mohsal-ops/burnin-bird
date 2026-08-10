// app/(customerFacing)/actions/check.ts
'use server'

import db from "@/db/db";
import { cookies } from "next/headers";

export const CheckForTimeAndDay = async () => {
    const cartId = (await cookies()).get("cart_id")?.value;
    if (!cartId){ 
        
        return false};
        
        const cart = await db.cart.findUnique({
            where: { id: cartId },
            select: { items: true },
        });
        
  if (!cart || cart.items.length === 0) return false;

  const pickupDay = cart.items[0]?.pickupDay;


  return !!pickupDay; // ✅ converts truthy value to true / falsy to false
};