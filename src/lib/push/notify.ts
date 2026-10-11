import "server-only";
import db from "@/db/db";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { courierMessage, readyMessage } from "./messages";
import { pushToCustomer } from "./send";

// Customer pushes on order events. All best-effort and no-ops unless the
// "web_push" flag is on and the customer opted in for that order.

/** Courier status changed (Uber callback / DoorDash webhook). */
export async function notifyCourierStatus(cartId: string, prev: string | null | undefined, next: string | undefined) {
  if (!next || next === prev) return;
  await pushToCustomer(cartId, courierMessage(next, SITE_CONFIG.name, cartId)).catch(() => 0);
}

/** Kitchen marked the order completed. */
export async function notifyOrderReady(cartId: string) {
  const item = await db.cartItem.findFirst({ where: { cartId }, select: { orderType: true, deliveryAddress: true } });
  const type = item?.orderType === "delivery" || item?.deliveryAddress ? "delivery" : "pickup";
  await pushToCustomer(cartId, readyMessage(type, SITE_CONFIG.name, cartId)).catch(() => 0);
}
