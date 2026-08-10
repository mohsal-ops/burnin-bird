// app/api/cart/add/route.ts
import { NextResponse } from "next/server";
import { getOrCreateCart } from "@/lib/cart";
import db from "@/db/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const {pickupTime, pickupDay, orderType } = await req.json();

  try {
    const cart = await getOrCreateCart();
  // Upsert item: if productId exists, increase qty
  const existing = await db.cartItem.findFirst({ where: { cartId: cart.id } });
  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { pickupDay , pickupTime, orderType }
    });
    revalidatePath('cart')
  return NextResponse.json({ok:true , message : 'time updated'})
  } else {
    await db.cartItem.create({
      data: {pickupDay,pickupTime, orderType, cartId: cart.id }
    });
  }
    revalidatePath('cart')
    

  return NextResponse.json({ok:true , message : 'Time added succefuly'})
    
  } catch (error) {
    console.log(error)

    return NextResponse.json({ok:false ,error,message:'error while adding Time'})
    
  }
  
}
