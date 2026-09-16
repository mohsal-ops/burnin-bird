"use server";
import { assertWritable } from "@/lib/previewGuard";

import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { deriveOrderType } from "@/lib/orderType";
import { PAID_STATUSES, isPaid } from "@/lib/orderStatus";

export type CartOrderStatus = "open" | "new" | "completed" | "abandoned";

export async function getOrdersWithItems(status?: CartOrderStatus) {
  const carts = await db.cart.findMany({
    where: status ? { status } : undefined,
    include: { items: { include: { sides: true } } },
    orderBy: { updatedAt: "desc" },
  });
  // Hide fully-empty open carts (nothing was ever added) - not a real order.
  return carts.filter((cart) => cart.items.length > 0);
}

export async function updateCartStatus(cartId: string, status: CartOrderStatus) {
  await assertWritable();
  await db.cart.update({ where: { id: cartId }, data: { status } });
  revalidatePath("/admin/orders");
}

export async function deleteCart(cartId: string) {
  await assertWritable();
  await db.cartItem.deleteMany({ where: { cartId } });
  await db.cart.delete({ where: { id: cartId } });
  revalidatePath("/admin/orders");
}

function getChicagoNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: SITE_CONFIG.timezone }));
}

function getTodayBoundsUTC() {
  const now = new Date();
  const chicagoNow = getChicagoNow();
  const offsetMs = now.getTime() - chicagoNow.getTime();
  const startOfDay = new Date(chicagoNow.getFullYear(), chicagoNow.getMonth(), chicagoNow.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  return {
    start: new Date(startOfDay.getTime() + offsetMs),
    end: new Date(endOfDay.getTime() + offsetMs),
  };
}

function itemTotalCents(item: { price: number | null; quantity: number | null }) {
  return (item.price ?? 0) * (item.quantity ?? 1);
}

// Lightweight "today" numbers for the persistent admin live bar. Same source and
// definitions as getOrderStats (Cart + isPaid), just without the heavy
// most-ordered aggregation - so it's cheap to run on every admin page.
export async function getTodaySummary() {
  const { start, end } = getTodayBoundsUTC();
  const carts = await db.cart.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { items: true },
  });
  const orders = carts.filter((c) => c.items.length > 0);
  const paid = orders.filter((c) => isPaid(c.status));
  const salesTodayCents = paid.reduce(
    (sum, c) => sum + c.items.reduce((s, i) => s + itemTotalCents(i), 0),
    0,
  );
  return {
    salesTodayCents,
    ordersToday: orders.length, // matches the Sales page's "Orders Today"
    newOrders: orders.filter((c) => c.status === "new").length, // unfulfilled
  };
}

export async function getOrderStats() {
  const { start, end } = getTodayBoundsUTC();

  const [todaysCarts, paidCarts] = await Promise.all([
    db.cart.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { items: true },
    }),
    // Every real (paid) order ever - "new" (awaiting kitchen) + "completed".
    db.cart.findMany({
      where: { status: { in: [...PAID_STATUSES] } },
      include: { items: true },
    }),
  ]);

  const todaysOrders = todaysCarts.filter((c) => c.items.length > 0);
  // Revenue counts paid orders (a "new" order is already paid).
  const todaysPaid = todaysOrders.filter((c) => isPaid(c.status));

  const totalOrdersToday = todaysOrders.length;
  const revenueTodayCents = todaysPaid.reduce(
    (sum, cart) => sum + cart.items.reduce((s, item) => s + itemTotalCents(item), 0),
    0,
  );
  const averageOrderValueCents =
    todaysPaid.length > 0 ? Math.round(revenueTodayCents / todaysPaid.length) : 0;

  // Pickup vs delivery split, based on all real (non-empty) orders today.
  let pickupCount = 0;
  let deliveryCount = 0;
  for (const cart of todaysOrders) {
    const first = cart.items[0];
    if (deriveOrderType(first) === "delivery") deliveryCount++;
    else pickupCount++;
  }

  // Orders placed per hour today, Chicago local time.
  const ordersByHour = Array.from({ length: 24 }, () => 0);
  for (const cart of todaysOrders) {
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: SITE_CONFIG.timezone,
        hour: "numeric",
        hour12: false,
      }).format(cart.createdAt),
    );
    ordersByHour[hour % 24]++;
  }

  // Most ordered item, aggregated across every paid order ever placed.
  const productCounts = new Map<string, { name: string; count: number }>();
  for (const cart of paidCarts) {
    for (const item of cart.items) {
      if (!item.productId || !item.name) continue;
      const existing = productCounts.get(item.productId);
      const qty = item.quantity ?? 1;
      if (existing) existing.count += qty;
      else productCounts.set(item.productId, { name: item.name, count: qty });
    }
  }
  const mostOrderedItem = [...productCounts.values()].sort((a, b) => b.count - a.count)[0] ?? null;

  return {
    totalOrdersToday,
    revenueTodayCents,
    averageOrderValueCents,
    pickupCount,
    deliveryCount,
    ordersByHour,
    mostOrderedItem,
  };
}
