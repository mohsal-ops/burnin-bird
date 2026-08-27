import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import db from "@/db/db";
import { revalidatePath } from "next/cache";

// Receives Uber delivery-status updates relayed by the ONE central webhook on
// the builder (which verifies Uber's signature). Authed with a shared bearer
// secret (UBER_STATUS_SECRET) so only the builder can call it. Updates this
// site's own order in its own DB.
export const runtime = "nodejs";

function authed(req: NextRequest): boolean {
  const secret = process.env.UBER_STATUS_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { cartId, status, trackingUrl } = (await req.json().catch(() => ({}))) as {
    cartId?: string;
    status?: string;
    trackingUrl?: string;
  };
  if (!cartId) return NextResponse.json({ error: "missing cartId" }, { status: 400 });

  try {
    await db.cart.updateMany({
      where: { id: cartId },
      data: {
        ...(status ? { uberStatus: status } : {}),
        ...(trackingUrl ? { uberTrackingUrl: trackingUrl } : {}),
      },
    });
    revalidatePath("/admin/orders");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("uber status-callback update failed:", (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
