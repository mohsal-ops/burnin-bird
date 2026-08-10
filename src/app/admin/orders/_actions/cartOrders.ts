"use server";

import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { deriveOrderType } from "@/lib/orderType";

export type CartOrderStatus = "open" | "completed" | "abandoned";

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
  await db.cart.update({ where: { id: cartId }, data: { status } });
  revalidatePath("/admin/orders");
}

export async function deleteCart(cartId: string) {
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

export async function getOrderStats() {
  const { start, end } = getTodayBoundsUTC();

  const [todaysCarts, completedCarts] = await Promise.all([
    db.cart.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { items: true },
    }),
    db.cart.findMany({
      where: { status: "completed" },
      include: { items: true },
    }),
  ]);

  const todaysOrders = todaysCarts.filter((c) => c.items.length > 0);
  const todaysCompleted = todaysOrders.filter((c) => c.status === "completed");

  const totalOrdersToday = todaysOrders.length;
  const revenueTodayCents = todaysCompleted.reduce(
    (sum, cart) => sum + cart.items.reduce((s, item) => s + itemTotalCents(item), 0),
    0,
  );
  const averageOrderValueCents =
    todaysCompleted.length > 0 ? Math.round(revenueTodayCents / todaysCompleted.length) : 0;

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

  // Most ordered item, aggregated across every completed order ever placed.
  const productCounts = new Map<string, { name: string; count: number }>();
  for (const cart of completedCarts) {
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
