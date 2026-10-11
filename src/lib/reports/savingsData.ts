import "server-only";
import { createHmac } from "node:crypto";
import db from "@/db/db";
import { PAID_STATUSES } from "@/lib/orderStatus";
import { deriveOrderType } from "@/lib/orderType";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { aggregateMonth, DEFAULT_COMMISSION_PCT, monthBounds, type MonthStats } from "./savings";

// Loads a month of paid website orders. Order time = Cart.createdAt (there's
// no paid-at column; carts are paid within minutes of creation).

const PCT_KEY = "savings_commission_pct";
const UNSUB_KEY = "savings_report_unsubscribed";

export async function getCommissionPct(): Promise<number> {
  const row = await db.siteSetting.findUnique({ where: { key: PCT_KEY } }).catch(() => null);
  const n = row ? Number(row.value) : NaN;
  return Number.isFinite(n) ? n : DEFAULT_COMMISSION_PCT;
}

export async function setCommissionPct(pct: number) {
  const v = String(Math.min(Math.max(Math.round(pct), 0), 60));
  await db.siteSetting.upsert({ where: { key: PCT_KEY }, update: { value: v }, create: { key: PCT_KEY, value: v } });
}

export async function isReportUnsubscribed(): Promise<boolean> {
  const row = await db.siteSetting.findUnique({ where: { key: UNSUB_KEY } }).catch(() => null);
  return row?.value === "1";
}

export async function setReportUnsubscribed(on: boolean) {
  const value = on ? "1" : "0";
  await db.siteSetting.upsert({ where: { key: UNSUB_KEY }, update: { value }, create: { key: UNSUB_KEY, value } });
}

/** Signed token for the one-click unsubscribe link (no login needed). */
export function unsubscribeToken(): string {
  return createHmac("sha256", `report-unsub:${process.env.ADMIN_SECRET ?? ""}`).update(SITE_CONFIG.siteUrl).digest("hex").slice(0, 32);
}

export async function statsForMonth(year: number, month0: number): Promise<MonthStats> {
  const { start, end, label } = monthBounds(year, month0, SITE_CONFIG.timezone);
  const carts = await db.cart.findMany({
    where: { status: { in: [...PAID_STATUSES] }, createdAt: { gte: start, lt: end } },
    select: {
      uberFeeCents: true,
      deliveryCourierFeeCents: true,
      items: { select: { name: true, price: true, quantity: true, orderType: true, deliveryAddress: true } },
    },
  });
  const base = aggregateMonth(
    carts.map((c) => {
      const isDelivery = !!c.items[0] && deriveOrderType(c.items[0]) === "delivery";
      return { items: c.items, isDelivery, courierFeeCents: isDelivery ? c.deliveryCourierFeeCents ?? c.uberFeeCents ?? 0 : 0 };
    }),
    label,
  );

  // Repeat customers: people (by email, via the Order history finalizeCart
  // writes) who ordered this month AND had ordered before it.
  const repeatCustomers = await db.order
    .findMany({ where: { createdAt: { gte: start, lt: end } }, select: { userId: true }, distinct: ["userId"] })
    .then(async (rows) => {
      if (!rows.length) return 0;
      const before = await db.order.findMany({
        where: { userId: { in: rows.map((r) => r.userId) }, createdAt: { lt: start } },
        select: { userId: true },
        distinct: ["userId"],
      });
      return before.length;
    })
    .catch(() => null);

  const loyaltyOn = await db.siteSetting
    .findUnique({ where: { key: "loyalty_enabled" } })
    .then((r) => r?.value === "true" || r?.value === "1")
    .catch(() => false);
  const newLoyaltySubscribers = loyaltyOn
    ? await db.loyaltyContact.count({ where: { createdAt: { gte: start, lt: end } } }).catch(() => null)
    : null;

  return { ...base, repeatCustomers, newLoyaltySubscribers };
}
