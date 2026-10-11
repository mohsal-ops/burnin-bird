import "server-only";
import db from "@/db/db";
import { getOutreach } from "@/lib/outreach";
import { PAID_STATUSES } from "@/lib/orderStatus";
import { deriveOrderType } from "@/lib/orderType";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { computeSavings, monthBounds, type ReportOrder, type SavingsReport } from "./savings";

// Loads a month of paid website orders and runs the pure maths. Order time =
// Cart.createdAt (there's no paid-at column; carts are paid within minutes).

const PCT_KEY = "savings_commission_pct";

export async function getCommissionPct(): Promise<number> {
  const row = await db.siteSetting.findUnique({ where: { key: PCT_KEY } }).catch(() => null);
  const n = row ? Number(row.value) : NaN;
  return Number.isFinite(n) ? n : getOutreach().savings.commissionPct;
}

export async function setCommissionPct(pct: number) {
  const v = String(Math.min(Math.max(Math.round(pct), 0), 60));
  await db.siteSetting.upsert({ where: { key: PCT_KEY }, update: { value: v }, create: { key: PCT_KEY, value: v } });
}

export async function savingsForMonth(year: number, month0: number): Promise<SavingsReport & { label: string }> {
  const { start, end, label } = monthBounds(year, month0, SITE_CONFIG.timezone);
  const carts = await db.cart.findMany({
    where: { status: { in: [...PAID_STATUSES] }, createdAt: { gte: start, lt: end } },
    select: { uberFeeCents: true, items: { select: { price: true, quantity: true, orderType: true, deliveryAddress: true } } },
  });
  const orders: ReportOrder[] = carts
    .filter((c) => c.items.length)
    .map((c) => {
      const itemsCents = c.items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
      const fee = deriveOrderType(c.items[0]) === "delivery" ? c.uberFeeCents ?? 0 : 0;
      return { itemsCents, chargedCents: itemsCents + fee };
    });
  return { ...computeSavings(orders, await getCommissionPct()), label };
}
