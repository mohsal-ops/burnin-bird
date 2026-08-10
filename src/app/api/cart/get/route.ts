// app/api/cart/get/route.ts
import { GetCartItems } from "@/app/(customerFacing)/Menu/_actions/getDataNeeded";
import db from "@/db/db";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const cartId = req.headers.get("x-cart-id")!;
  const cart = await GetCartItems(cartId);
  
  revalidateTag('cart')
  return NextResponse.json({cart});
}