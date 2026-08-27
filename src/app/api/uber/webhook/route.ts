import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import db from "@/db/db";
import { revalidatePath } from "next/cache";

// Uber Direct delivery-status webhook.
// Verifies the HMAC-SHA256 signature (header x-uber-signature, computed over the
// RAW body with the Webhook Signing Key), then advances the matching order's
// uberStatus. Handles event.delivery_status and event.courier_update.
export const runtime = "nodejs";

function verify(rawBody: string, signature: string | null): boolean {
  const key = process.env.UBER_DIRECT_WEBHOOK_SIGNING_KEY;
  if (!key || !signature) return false;
  const expected = createHmac("sha256", key).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig =
    req.headers.get("x-uber-signature") || req.headers.get("x-postmates-signature");
  if (!verify(raw, sig)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  const eventType = String(body.event_type || body.kind || "");
  const data = (body.data && typeof body.data === "object" ? body.data : {}) as Record<string, unknown>;
  const meta = (body.meta && typeof body.meta === "object" ? body.meta : {}) as Record<string, unknown>;

  // Uber's payload shape varies by event; pull the delivery id + status from the
  // likely locations.
  const deliveryId = String(
    body.delivery_id || data.id || meta.resource_id || "",
  );
  const status = String(data.status || body.status || meta.status || "");
  const trackingUrl = data.tracking_url ? String(data.tracking_url) : undefined;

  if (!deliveryId) return new NextResponse("no delivery id", { status: 200 });

  if (eventType.includes("delivery_status") || eventType.includes("courier_update")) {
    try {
      await db.cart.updateMany({
        where: { uberDeliveryId: deliveryId },
        data: {
          ...(status ? { uberStatus: status } : {}),
          ...(trackingUrl ? { uberTrackingUrl: trackingUrl } : {}),
        },
      });
      revalidatePath("/admin/orders");
    } catch (e) {
      console.error("Uber webhook update failed:", (e as Error).message);
      // Return 200 anyway so Uber doesn't hammer retries for a transient DB blip.
    }
  }

  return new NextResponse("ok", { status: 200 });
}
