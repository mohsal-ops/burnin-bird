import { PiggyBank } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { previousMonth } from "@/lib/reports/savings";
import { savingsForMonth } from "@/lib/reports/savingsData";
import { CARD_FIXED_CENTS, CARD_PCT } from "@/lib/reports/savings";
import CommissionInput from "./CommissionInput";

// Admin home card (flag "savings_report"). Real numbers from this site's own
// paid orders; the commission % is the owner's to set.

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default async function SavingsCard() {
  const tz = SITE_CONFIG.timezone;
  const now = new Date();
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit" }).format(now).split("-").map(Number);
  const prev = previousMonth(now, tz);
  const [thisMonth, lastMonth] = await Promise.all([savingsForMonth(y, m - 1), savingsForMonth(prev.year, prev.month0)]);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <PiggyBank size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-stone-500">Kept vs. a delivery app · {thisMonth.label} so far</p>
          <p className="text-2xl font-bold text-stone-900">{usd(thisMonth.keptCents)}</p>
          <p className="text-sm text-stone-500">
            {thisMonth.orders} online order{thisMonth.orders === 1 ? "" : "s"} · {usd(thisMonth.grossCents)} in food sales
            {lastMonth.orders > 0 && ` · ${lastMonth.label}: ${usd(lastMonth.keptCents)} kept`}
          </p>
        </div>
      </div>
      <details className="mt-3 text-sm text-stone-600">
        <summary className="cursor-pointer text-stone-500">How this is worked out</summary>
        <div className="mt-2 space-y-1">
          <p>
            Commission an app would take: {usd(thisMonth.commissionAvoidedCents)} ({thisMonth.commissionPct}% of food sales)
          </p>
          <p>
            Minus card fees you pay instead: {usd(thisMonth.cardFeesCents)} (est. {CARD_PCT}% + {CARD_FIXED_CENTS}¢ per order)
          </p>
          <CommissionInput initial={thisMonth.commissionPct} />
        </div>
      </details>
    </div>
  );
}
