import { NextRequest, NextResponse } from "next/server";
import db from "@/db/db";
import { isEnabled } from "@/lib/flags";
import { getAdminIdFromRequest } from "@/lib/adminAuth";
import { isPaid } from "@/lib/orderStatus";
import { pushToCustomer } from "@/lib/push/send";
import { SITE_CONFIG } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

// Save / remove a browser push subscription.
//   owner    → must be a signed-in admin
//   customer → must name a PAID order from the last 24h (cart ids are UUIDs,
//              so this can't be used to spam other people's orders)

type Body = {
  audience?: string;
  cartId?: string;
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
};

export async function POST(req: NextRequest) {
  if (!(await isEnabled("web_push"))) return NextResponse.json({ error: "off" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as Body;
  const sub = b.subscription;
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys.auth) {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }

  let audience: "owner" | "customer";
  let cartId: string | null = null;
  if (b.audience === "owner") {
    if (!(await getAdminIdFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    audience = "owner";
  } else {
    const cart = b.cartId ? await db.cart.findUnique({ where: { id: b.cartId }, select: { id: true, status: true, updatedAt: true } }) : null;
    if (!cart || !isPaid(cart.status) || Date.now() - cart.updatedAt.getTime() > 24 * 3600_000) {
      return NextResponse.json({ error: "order not found" }, { status: 404 });
    }
    audience = "customer";
    cartId = cart.id;
  }

  const data = {
    p256dh: sub.keys.p256dh.slice(0, 200),
    auth: sub.keys.auth.slice(0, 100),
    audience,
    cartId,
    userAgent: req.headers.get("user-agent")?.slice(0, 200) ?? null,
    failures: 0,
  };
  await db.pushSubscription.upsert({
    where: { endpoint: sub.endpoint.slice(0, 1000) },
    update: data,
    create: { endpoint: sub.endpoint.slice(0, 1000), ...data },
  });
  // Confirms it works and is the "received" step of the order updates.
  if (audience === "customer" && cartId) {
    await pushToCustomer(cartId, {
      title: "Order received ✅",
      body: `${SITE_CONFIG.name} has your order. We'll tell you when it's ready.`,
      url: "/",
      tag: `order-${cartId}`,
    }).catch(() => 0);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (b.endpoint) await db.pushSubscription.deleteMany({ where: { endpoint: b.endpoint } });
  return NextResponse.json({ ok: true });
}
