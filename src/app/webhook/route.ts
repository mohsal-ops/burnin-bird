import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import db from "@/db/db";
import { google } from "googleapis";
import { revalidatePath, revalidateTag } from "next/cache";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendMail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getUberDirect } from "@/lib/siteSettings";
import { createDelivery } from "@/lib/uber";
import { deriveOrderType } from "@/lib/orderType";

// Uber Direct needs phone numbers in E.164. Coerce a US-style number; leave an
// already-+prefixed number as-is.
function toE164(phone?: string | null): string {
  const raw = (phone || "").trim();
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

const formatSides = (sides: any[]) => {
  if (!sides || sides.length === 0) return "";

  // group by sideGroupId
  const grouped: Record<string, any[]> = {};

  for (const s of sides) {
    if (!grouped[s.sideGroupId]) grouped[s.sideGroupId] = [];
    grouped[s.sideGroupId].push(s);
  }

  return Object.values(grouped)
    .map((group) => {
      const options = group
        .map((o) =>
          o.priceInCents
            ? `${o.label} (+$${(o.priceInCents / 100).toFixed(2)})`
            : o.label,
        )
        .join(", ");

      return options;
    })
    .join(" | ");
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

// Google Sheets client
const key = JSON.parse(process.env.GOOGLE_SERVICE_KEY || "{}");

const auth = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return new NextResponse("Missing signature", { status: 400 });

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );

    if (event.type !== "payment_intent.succeeded") {
      return new NextResponse("Ignored", { status: 200 });
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const cartId = paymentIntent.metadata.cartId;
    const email = paymentIntent.receipt_email || "N/A";

    const cart = await db.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            sides: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0 || cart.status === "completed") {
      // Cart already marked completed - this payment intent was already
      // processed by a prior webhook delivery (Stripe retries on non-2xx responses).
      return new NextResponse("Already processed", { status: 200 });
    }
    // Find or create user
    let user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      user = await db.user.create({ data: { email }, select: { id: true } });
    }

    // Create orders
    for (const cartItem of cart.items) {
      if (!cartItem.productId) continue;

      await db.order.create({
        data: {
          userId: user.id,
          productId: cartItem.productId,
          pricePaidInCents: (cartItem.price ?? 0) * (cartItem.quantity ?? 1),
        },
      });
    }

    // Mark the cart completed right after orders are saved, so a Stripe webhook
    // retry (from any later non-2xx) can't create duplicate orders - the guard
    // above short-circuits once status is "completed".
    await db.cart.update({ where: { id: cartId }, data: { status: "completed" } });

    const first = cart.items[0];

    // Uber Direct: dispatch a real courier for delivery orders when enabled. The
    // order is already paid + saved, so this is strictly best-effort — any
    // failure is logged + surfaced to the owner, and NEVER 500s the webhook
    // (that would make Stripe retry and risk duplicate handling).
    try {
      const uber = await getUberDirect();
      if (uber.enabled && deriveOrderType(first) === "delivery" && first.deliveryAddress) {
        if (!cart.uberQuoteId) {
          await sendTelegramMessage(
            `⚠️ Delivery order ${cart.id} has no Uber quote — please arrange delivery manually.`,
          );
        } else {
          const dropoffNotes = [first.apt ? `Apt/Suite: ${first.apt}` : "", first.instructions || ""]
            .filter(Boolean)
            .join(" — ");
          const delivery = await createDelivery({
            quoteId: cart.uberQuoteId,
            pickup: {
              formatted: SITE_CONFIG.address,
              lat: SITE_CONFIG.lat,
              lng: SITE_CONFIG.lng,
              name: SITE_CONFIG.name,
              businessName: SITE_CONFIG.name,
              phone: toE164(SITE_CONFIG.phone),
            },
            dropoff: {
              formatted: first.deliveryAddress,
              lat: first.deliveryLat,
              lng: first.deliveryLng,
              name: first.customerName || "Customer",
              phone: toE164(first.customerPhone),
              notes: dropoffNotes || undefined,
            },
            manifestItems: cart.items
              .filter((it) => it.name)
              .map((it) => ({ name: it.name as string, quantity: it.quantity ?? 1 })),
            externalId: cart.id,
          });
          await db.cart.update({
            where: { id: cart.id },
            data: {
              uberDeliveryId: delivery.id,
              uberStatus: delivery.status,
              uberTrackingUrl: delivery.trackingUrl ?? null,
            },
          });
        }
      }
    } catch (e) {
      console.error("Uber Direct dispatch failed (order still saved):", (e as Error).message);
      await sendTelegramMessage(
        `⚠️ Uber delivery dispatch FAILED for order ${cart.id}: ${(e as Error).message}. Please arrange delivery manually.`,
      ).catch(() => {});
    }

    const itemsList = cart.items
      .map((it) => {
        if (!it.name) return null; // skip items without a name
        const quantity = it.quantity ?? 1;
        const basePrice = (it.price ?? 0) * quantity;
        const sidesTotal = it.sides.reduce(
          (sum, s) => sum + (s.priceInCents ?? 0),
          0,
        );
        const totalPrice = (basePrice + sidesTotal) / 100;

        // sides as string
        const sidesStr = it.sides.map((s) => s.label).join(" | ");
        return (
          `${it.name} x${quantity} ($${totalPrice.toFixed(2)})` +
          (sidesStr ? " → " + sidesStr : "")
        );
      })
      .filter(Boolean) // remove nulls
      .join(" | ");

    const total =
      cart.items.reduce((sum, it) => {
        const base = (it.price ?? 0) * (it.quantity ?? 1);

        const sides = it.sides.reduce(
          (s, side) => s + (side.priceInCents ?? 0),
          0,
        );

        return sum + base + sides;
      }, 0) / 100;

    const row = [
      cart.id, // Order ID
      first.orderType || "pickup", // Type
      first.customerName || "",
      first.customerPhone || "",
      email,
      first.deliveryAddress || "",
      first.deliveryLat ?? "",
      first.deliveryLng ?? "",
      first.apt || "",
      first.instructions || "",
      first.pickupDay ? new Date(first.pickupDay).toDateString() : "",
      first.pickupTime || "",
      itemsList,
      total,
      new Date().toLocaleString(),
    ];

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A1",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [row],
        },
      });
    } catch (e) {
      console.error("Google Sheets append failed (order still saved):", e);
    }

    // Notify the restaurant immediately - Telegram is already wired up (src/lib/telegram.ts).
    const orderType = first.deliveryAddress ? "delivery" : "pickup";
    const notification =
      `<b>🔔 New order - $${total.toFixed(2)}</b>\n` +
      `Type: ${orderType}\n` +
      (first.customerName ? `Name: ${first.customerName}\n` : "") +
      (first.customerPhone ? `Phone: ${first.customerPhone}\n` : "") +
      (orderType === "delivery"
        ? `Address: ${first.deliveryAddress}${first.apt ? ` (${first.apt})` : ""}\n` +
          (first.instructions ? `Instructions: ${first.instructions}\n` : "")
        : `Pickup: ${first.pickupDay ? new Date(first.pickupDay).toDateString() : ""} ${first.pickupTime ?? ""}\n`) +
      `Items: ${itemsList}`;
    await sendTelegramMessage(notification);

    // Email the owner a copy of every order (best-effort - never blocks the
    // order). Recipient is OWNER_ALERT_EMAIL, falling back to the SMTP account.
    try {
      const alertTo = process.env.OWNER_ALERT_EMAIL || process.env.SMTP_USER;
      if (alertTo) {
        await sendMail({
          to: alertTo,
          subject: `New order - $${total.toFixed(2)} - ${SITE_CONFIG.name}`,
          html: `
            <div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917">
              <h2 style="margin:0 0 12px">New ${orderType} order - $${total.toFixed(2)}</h2>
              <table style="border-collapse:collapse">
                ${first.customerName ? `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Name</td><td>${first.customerName}</td></tr>` : ""}
                ${first.customerPhone ? `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Phone</td><td>${first.customerPhone}</td></tr>` : ""}
                <tr><td style="padding:4px 14px 4px 0;color:#78716c">Email</td><td>${email}</td></tr>
                ${
                  orderType === "delivery"
                    ? `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Deliver to</td><td>${first.deliveryAddress ?? ""}${first.apt ? ` (${first.apt})` : ""}</td></tr>`
                    : `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Pickup</td><td>${first.pickupDay ? new Date(first.pickupDay).toDateString() : ""} ${first.pickupTime ?? ""}</td></tr>`
                }
                <tr><td style="padding:4px 14px 4px 0;color:#78716c;vertical-align:top">Items</td><td>${itemsList}</td></tr>
                <tr><td style="padding:4px 14px 4px 0;color:#78716c">Total</td><td><strong>$${total.toFixed(2)}</strong></td></tr>
              </table>
              <p style="margin-top:16px;color:#78716c;font-size:13px">This order is also in your admin dashboard under Orders.</p>
            </div>`,
        });
      }
    } catch (e) {
      console.error("Order email failed (order still saved):", e);
    }

    revalidatePath("/Menu");
    revalidatePath("/stripe/purchase-success");
    revalidatePath("/admin/orders");

    return new NextResponse("Order saved", { status: 201 });
  } catch (err) {
    console.error(err);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
