import db from "@/db/db";
import { SITE_CONFIG } from "@/lib/siteConfig";

// Owner's "morning briefing" numbers - today's money + this-week trend, plus
// the couple of things that actually need action. All derived from data we
// already store (Cart/CartItem/CateringRequest), no new schema.
export async function getOwnerBriefing() {
  const now = new Date();
  // Bucket orders by Chicago calendar day. We approximate the tz offset once
  // (fine for a dashboard; DST edge days are close enough).
  const chicagoNow = new Date(now.toLocaleString("en-US", { timeZone: SITE_CONFIG.timezone }));
  const offset = now.getTime() - chicagoNow.getTime();
  const startOfToday = new Date(
    new Date(chicagoNow.getFullYear(), chicagoNow.getMonth(), chicagoNow.getDate()).getTime() +
      offset,
  );
  // 14 daily buckets ending today: [0..6] = prior week, [7..13] = this week.
  const windowStart = new Date(startOfToday.getTime() - 13 * 86400000);

  const [carts, newCatering, inactiveItems] = await Promise.all([
    db.cart.findMany({
      where: { createdAt: { gte: windowStart } },
      include: { items: { select: { price: true, quantity: true } } },
    }),
    db.cateringRequest.count({ where: { status: "new" } }),
    db.item.count({ where: { isAvailableForPurchase: false } }),
  ]);

  const cartTotal = (items: { price: number | null; quantity: number | null }[]) =>
    items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);

  const dailyRevenue = new Array(14).fill(0);
  const dailyOrders = new Array(14).fill(0);

  for (const cart of carts) {
    if (cart.items.length === 0 || cart.status !== "completed") continue;
    const idx = Math.floor((cart.createdAt.getTime() - windowStart.getTime()) / 86400000);
    if (idx < 0 || idx > 13) continue;
    dailyRevenue[idx] += cartTotal(cart.items);
    dailyOrders[idx] += 1;
  }

  const last7Revenue = dailyRevenue.slice(7);
  const last7Orders = dailyOrders.slice(7);
  const prev7Revenue = dailyRevenue.slice(0, 7);

  const weekRevenueCents = last7Revenue.reduce((a, b) => a + b, 0);
  const prevWeekRevenueCents = prev7Revenue.reduce((a, b) => a + b, 0);
  const weekOrders = last7Orders.reduce((a, b) => a + b, 0);

  return {
    revenueTodayCents: last7Revenue[6],
    ordersToday: last7Orders[6],
    weekRevenueCents,
    weekOrders,
    avgOrderCents: weekOrders > 0 ? Math.round(weekRevenueCents / weekOrders) : 0,
    weekDeltaPct:
      prevWeekRevenueCents > 0
        ? Math.round(((weekRevenueCents - prevWeekRevenueCents) / prevWeekRevenueCents) * 100)
        : null,
    sparkRevenue: last7Revenue as number[],
    newCatering,
    inactiveItems,
  };
}
