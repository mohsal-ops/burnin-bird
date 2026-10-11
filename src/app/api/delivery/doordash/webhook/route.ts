import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import db from "@/db/db";
import { cartIdFromExternal, mapDoorDashStatus } from "@/lib/delivery/doordash";
import { getDoorDashSettings } from "@/lib/delivery/settings";
import { notifyCourierStatus } from "@/lib/push/notify";

export const dynamic = "force-dynamic";

// DoorDash Drive status webhook. Each restaurant has its own Drive account, so
// it points that account's webhook at its own site with the Authorization
// header value shown in admin → Delivery. Updates the courier status/tracking
// on the order (same columns the Uber callback writes).

const EVENT_STATUS: Record<string, string> = {
  DASHER_CONFIRMED: "pending",
  DASHER_CONFIRMED_PICKUP_ARRIVAL: "pickup",
  DASHER_PICKED_UP: "pickup_complete",
  DASHER_CONFIRMED_CONSUMER_ARRIVAL: "dropoff",
  DASHER_DROPPED_OFF: "delivered",
  DELIVERY_CANCELLED: "canceled",
  DELIVERY_RETURNED: "returned",
};

function authorised(header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const got = Buffer.from(header.replace(/^Bearer\s+/i, "").trim());
  const want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function POST(req: Request) {
  const settings = await getDoorDashSettings();
  if (!settings || !authorised(req.headers.get("authorization"), settings.webhookSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    event_name?: string;
    external_delivery_id?: string;
    delivery_status?: string;
    tracking_url?: string;
  };
  if (!body.external_delivery_id) return NextResponse.json({ ok: true });

  const status = body.delivery_status
    ? mapDoorDashStatus(body.delivery_status)
    : EVENT_STATUS[body.event_name ?? ""] ?? null;
  const cartId = cartIdFromExternal(body.external_delivery_id);
  const prev = await db.cart.findUnique({ where: { id: cartId }, select: { uberStatus: true, deliveryProvider: true } });
  if (prev?.deliveryProvider !== "doordash_drive") return NextResponse.json({ ok: true });
  await db.cart.updateMany({
    where: { id: cartId, deliveryProvider: "doordash_drive" },
    data: {
      ...(status ? { uberStatus: status } : {}),
      ...(body.tracking_url ? { uberTrackingUrl: body.tracking_url } : {}),
    },
  });
  if (status) await notifyCourierStatus(cartId, prev.uberStatus, status);
  return NextResponse.json({ ok: true });
}
