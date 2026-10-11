import { NextResponse } from "next/server";
import db from "@/db/db";
import { appApiOff } from "@/lib/app/guard";
import { isPaid } from "@/lib/orderStatus";
import { deriveOrderType } from "@/lib/orderType";

export const dynamic = "force-dynamic";

// Order status for the app's tracking + history screens. Cart ids are random
// UUIDs only the ordering phone knows. No name/phone/address is returned.
export async function GET(_req: Request, { params }: { params: Promise<{ cartId: string }> }) {
  const off = await appApiOff();
  if (off) return off;
  const { cartId } = await params;
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: { items: { select: { name: true, quantity: true, price: true, orderType: true, deliveryAddress: true } } },
  });
  if (!cart || !cart.items.length) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const isDelivery = deriveOrderType(cart.items[0]) === "delivery";
  return NextResponse.json({
    id: cart.id,
    paid: isPaid(cart.status),
    status: cart.status,
    orderType: isDelivery ? "delivery" : "pickup",
    courierStatus: cart.uberStatus,
    trackingUrl: cart.uberTrackingUrl,
    totalCents: cart.items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0) + (isDelivery ? cart.uberFeeCents ?? 0 : 0),
    items: cart.items.filter((i) => i.name).map((i) => ({ name: i.name, quantity: i.quantity ?? 1 })),
    createdAt: cart.createdAt.toISOString(),
  });
}
