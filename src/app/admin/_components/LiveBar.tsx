import { formatCurrency } from "@/lib/formatters";
import { StatusDot } from "./pos";
import { ShoppingBag, DollarSign } from "lucide-react";

// Persistent live bar shown at the top of EVERY admin screen. Today's sales +
// order count, from the same Cart data that powers the Sales/Analytics sections
// (getTodaySummary). Re-renders on navigation and on the Orders page's 5s poll
// (router.refresh re-runs this layout), so it stays current.
export default function LiveBar({
  salesTodayCents,
  ordersToday,
  newOrders,
}: {
  salesTodayCents: number;
  ordersToday: number;
  newOrders: number;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex items-center gap-4 px-4 py-2.5 md:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-green-800">
          <StatusDot tone="live" pulse /> Live
        </span>

        <div className="ml-auto flex items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2">
            <span className="hidden size-9 place-items-center rounded-lg bg-green-100 text-green-700 sm:grid">
              <DollarSign size={18} />
            </span>
            <div className="leading-none">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Sales today
              </div>
              <div className="text-xl font-extrabold tabular-nums tracking-tight text-stone-900 sm:text-2xl">
                {formatCurrency(salesTodayCents / 100)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden size-9 place-items-center rounded-lg bg-stone-100 text-stone-600 sm:grid">
              <ShoppingBag size={18} />
            </span>
            <div className="leading-none">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Orders today
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold tabular-nums tracking-tight text-stone-900 sm:text-2xl">
                  {ordersToday}
                </span>
                {newOrders > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    {newOrders} new
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
