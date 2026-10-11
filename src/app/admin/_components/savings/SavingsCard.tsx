import { PiggyBank } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { estimateSavings, MIN_ORDERS_FOR_ESTIMATE, previousMonth, usd } from "@/lib/reports/savings";
import { getCommissionPct, isReportUnsubscribed, statsForMonth } from "@/lib/reports/savingsData";
import { CommissionInput, ReportControls } from "./CommissionInput";

// Admin home card (flag "savings_report"). Real numbers from this site's own
// paid orders; the commission % is an estimate the owner can change.

export default async function SavingsCard() {
  const tz = SITE_CONFIG.timezone;
  const now = new Date();
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit" }).format(now).split("-").map(Number);
  const prev = previousMonth(now, tz);
  const [s, last, pct, unsub] = await Promise.all([
    statsForMonth(y, m - 1),
    statsForMonth(prev.year, prev.month0),
    getCommissionPct(),
    isReportUnsubscribed(),
  ]);
  const est = estimateSavings(s.revenueCents, pct);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <PiggyBank size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-stone-500">Not paid in app fees · {s.label} so far</p>
          <p className="text-2xl font-bold text-stone-900">≈ {usd(est)}</p>
          <p className="text-xs text-stone-500">
            Estimated at {pct}%. Your actual rate may differ.
            {s.orders > 0 && s.orders < MIN_ORDERS_FOR_ESTIMATE && ` Only ${s.orders} order(s) so far.`}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            {s.orders} website order{s.orders === 1 ? "" : "s"} · {usd(s.revenueCents)} sales
            {s.orders > 0 && ` · avg ${usd(s.avgOrderCents)}`}
            {last.orders > 0 && ` · ${last.label}: ≈ ${usd(estimateSavings(last.revenueCents, pct))}`}
          </p>
        </div>
      </div>
      <details className="mt-3 text-sm text-stone-600">
        <summary className="cursor-pointer text-stone-500">Details & settings</summary>
        <div className="mt-2 space-y-1.5">
          {s.topItems.length > 0 && <p>Top items: {s.topItems.map((t) => `${t.name} (${t.qty})`).join(", ")}</p>}
          {s.repeatCustomers !== null && <p>Repeat customers: {s.repeatCustomers}</p>}
          {s.newLoyaltySubscribers !== null && <p>New loyalty sign-ups: {s.newLoyaltySubscribers}</p>}
          {s.deliveryOrders > 0 && (
            <p>
              Delivery orders: {s.deliveryOrders} · courier cost {usd(s.courierCostCents)}
            </p>
          )}
          <CommissionInput initial={pct} />
          <ReportControls emailOn={!unsub} />
        </div>
      </details>
    </div>
  );
}
