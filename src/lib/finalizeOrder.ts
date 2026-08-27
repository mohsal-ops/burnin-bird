import "server-only";
import db from "@/db/db";
import { google } from "googleapis";
import { revalidatePath } from "next/cache";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendMail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getUberDirect } from "@/lib/siteSettings";
import { createDelivery } from "@/lib/uber";
import { deriveOrderType } from "@/lib/orderType";

// One place that finalizes a paid cart: mark it completed (so it counts as
// revenue and shows up right), save orders, dispatch the Uber courier for
// delivery, log to the sheet, and notify the owner + customer.
//
// Called from BOTH the Stripe webhook AND the success page. It's race-safe and
// idempotent via an atomic "claim" (updateMany where status != completed), so
// whichever fires first wins and the other no-ops. This is what makes orders
// complete even if the Stripe webhook isn't configured/firing.

function toE164(phone?: string | null): string {
  const raw = (phone || "").trim();
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

function sheetsClient() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_KEY || "{}");
  if (!key.client_email) return null;
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function finalizeCart(
  cartId: string | undefined,
  email: string,
): Promise<{ finalized: boolean; alreadyDone?: boolean }> {
  if (!cartId) return { finalized: false };

  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { sides: true } } },
  });
  if (!cart || cart.items.length === 0) return { finalized: false };
  if (cart.status === "completed") return { finalized: false, alreadyDone: true };

  // Atomically claim the cart. If another caller (webhook vs success page) already
  // claimed it, count is 0 and we stop — no duplicate orders/dispatch/emails.
  const claim = await db.cart.updateMany({
    where: { id: cartId, status: { not: "completed" } },
    data: { status: "completed" },
  });
  if (claim.count === 0) return { finalized: false, alreadyDone: true };

  const first = cart.items[0];

  // Orders + user (for history / most-ordered stats).
  try {
    let user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) user = await db.user.create({ data: { email }, select: { id: true } });
    for (const it of cart.items) {
      if (!it.productId) continue;
      await db.order.create({
        data: {
          userId: user.id,
          productId: it.productId,
          pricePaidInCents: (it.price ?? 0) * (it.quantity ?? 1),
        },
      });
    }
  } catch (e) {
    console.error("finalizeCart: order rows failed (cart still completed):", (e as Error).message);
  }

  // Uber Direct dispatch (delivery only, when enabled). Best-effort.
  try {
    const uber = await getUberDirect();
    if (uber.enabled && deriveOrderType(first) === "delivery" && first.deliveryAddress) {
      if (!cart.uberQuoteId) {
        await sendTelegramMessage(
          `⚠️ Delivery order ${cart.id} has no Uber quote — please arrange delivery manually.`,
        ).catch(() => {});
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
          externalId: `${cart.id}|${SITE_CONFIG.siteUrl}`,
        });
        await db.cart.update({
          where: { id: cart.id },
          data: {
            uberDeliveryId: delivery.id,
            uberStatus: delivery.status,
            uberTrackingUrl: delivery.trackingUrl ?? null,
          },
        });
        if (delivery.trackingUrl && email && email !== "N/A") {
          await sendMail({
            to: email,
            subject: `Your ${SITE_CONFIG.name} order is on the way 🚗`,
            html: `<div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917">
              <h2 style="margin:0 0 12px">Your order is on the way</h2>
              <p>A courier is bringing your ${SITE_CONFIG.name} order to ${first.deliveryAddress ?? "your address"}.</p>
              <p style="margin:18px 0"><a href="${delivery.trackingUrl}" style="background:#1c1917;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Track your delivery</a></p>
              <p style="color:#78716c;font-size:13px">This link stays live until your order arrives.</p></div>`,
          }).catch((e) => console.error("Customer tracking email failed:", e));
        }
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
      if (!it.name) return null;
      const quantity = it.quantity ?? 1;
      const basePrice = (it.price ?? 0) * quantity;
      const sidesTotal = it.sides.reduce((s, x) => s + (x.priceInCents ?? 0), 0);
      const totalPrice = (basePrice + sidesTotal) / 100;
      const sidesStr = it.sides.map((s) => s.label).join(" | ");
      return `${it.name} x${quantity} ($${totalPrice.toFixed(2)})` + (sidesStr ? " → " + sidesStr : "");
    })
    .filter(Boolean)
    .join(" | ");

  const total =
    cart.items.reduce((sum, it) => {
      const base = (it.price ?? 0) * (it.quantity ?? 1);
      const sides = it.sides.reduce((s, side) => s + (side.priceInCents ?? 0), 0);
      return sum + base + sides;
    }, 0) / 100;

  const orderType = deriveOrderType(first);

  // Google sheet log (best-effort).
  try {
    const sheets = sheetsClient();
    if (sheets && process.env.GOOGLE_SHEET_ID) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A1",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[
            cart.id, orderType, first.customerName || "", first.customerPhone || "", email,
            first.deliveryAddress || "", first.deliveryLat ?? "", first.deliveryLng ?? "",
            first.apt || "", first.instructions || "",
            first.pickupDay ? new Date(first.pickupDay).toDateString() : "", first.pickupTime || "",
            itemsList, total, new Date().toLocaleString(),
          ]],
        },
      });
    }
  } catch (e) {
    console.error("Google Sheets append failed (order still saved):", e);
  }

  // Owner notification (Telegram).
  await sendTelegramMessage(
    `<b>🔔 New order - $${total.toFixed(2)}</b>\nType: ${orderType}\n` +
      (first.customerName ? `Name: ${first.customerName}\n` : "") +
      (first.customerPhone ? `Phone: ${first.customerPhone}\n` : "") +
      (orderType === "delivery"
        ? `Address: ${first.deliveryAddress}${first.apt ? ` (${first.apt})` : ""}\n` +
          (first.instructions ? `Instructions: ${first.instructions}\n` : "")
        : `Pickup: ${first.pickupDay ? new Date(first.pickupDay).toDateString() : ""} ${first.pickupTime ?? ""}\n`) +
      `Items: ${itemsList}`,
  ).catch(() => {});

  // Owner email (best-effort).
  try {
    const alertTo = process.env.OWNER_ALERT_EMAIL || process.env.SMTP_USER;
    if (alertTo) {
      await sendMail({
        to: alertTo,
        subject: `New order - $${total.toFixed(2)} - ${SITE_CONFIG.name}`,
        html: `<div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917">
          <h2 style="margin:0 0 12px">New ${orderType} order - $${total.toFixed(2)}</h2>
          <table style="border-collapse:collapse">
            ${first.customerName ? `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Name</td><td>${first.customerName}</td></tr>` : ""}
            ${first.customerPhone ? `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Phone</td><td>${first.customerPhone}</td></tr>` : ""}
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Email</td><td>${email}</td></tr>
            ${orderType === "delivery"
              ? `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Deliver to</td><td>${first.deliveryAddress ?? ""}${first.apt ? ` (${first.apt})` : ""}</td></tr>`
              : `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Pickup</td><td>${first.pickupDay ? new Date(first.pickupDay).toDateString() : ""} ${first.pickupTime ?? ""}</td></tr>`}
            <tr><td style="padding:4px 14px 4px 0;color:#78716c;vertical-align:top">Items</td><td>${itemsList}</td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Total</td><td><strong>$${total.toFixed(2)}</strong></td></tr>
          </table></div>`,
      });
    }
  } catch (e) {
    console.error("Order email failed (order still saved):", e);
  }

  revalidatePath("/admin/orders");
  return { finalized: true };
}
