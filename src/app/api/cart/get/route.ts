// app/api/cart/get/route.ts
import { GetCartItems } from "@/app/(customerFacing)/Menu/_actions/getDataNeeded";
import db from "@/db/db";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  // The cookie is the real cart (it is what /api/cart/add writes to); the
  // header is only a fallback, so a stale client-side id can never show the
  // wrong cart.
  const cartId = (await cookies()).get("cart_id")?.value || req.headers.get("x-cart-id")!;
  const cart = await GetCartItems(cartId);
  
  revalidateTag('cart')
  return NextResponse.json({cart});
}