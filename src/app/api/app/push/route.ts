import { NextResponse } from "next/server";
import db from "@/db/db";
import { appApiOff } from "@/lib/app/guard";

export const dynamic = "force-dynamic";

// Native app registers its Expo push token for ONE order. Stored with the web
// push subscriptions (endpoint "expo:<token>") so the same order events
// (ready / on the way / delivered) reach it. Order-status only, no marketing.
export async function POST(req: Request) {
  const off = await appApiOff();
  if (off) return off;
  const b = (await req.json().catch(() => ({}))) as { token?: string; cartId?: string };
  const token = String(b.token ?? "");
  if (!/^Expo(nent)?PushToken\[[^\]]{10,200}\]$/.test(token)) return NextResponse.json({ error: "bad token" }, { status: 400 });
  const cart = b.cartId ? await db.cart.findUnique({ where: { id: String(b.cartId) }, select: { id: true, createdAt: true } }) : null;
  if (!cart || Date.now() - cart.createdAt.getTime() > 24 * 3600_000) return NextResponse.json({ error: "order not found" }, { status: 404 });
  const endpoint = `expo:${token}`;
  await db.pushSubscription.upsert({
    where: { endpoint },
    update: { cartId: cart.id, audience: "customer", failures: 0 },
    create: { endpoint, p256dh: "", auth: "", audience: "customer", cartId: cart.id, userAgent: "native-app" },
  });
  return NextResponse.json({ ok: true });
}
