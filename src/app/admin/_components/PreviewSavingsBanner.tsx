"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { savingsBreakdown, getOutreach, formatUsd } from "@/lib/outreach";
import PreviewInterestCheckbox from "./PreviewInterestCheckbox";

// Progressive-reveal headline for the preview dashboard: the savings number is
// visible immediately, but the actual math is one click away — so a 10-second
// glance can't absorb the whole case. Carries the single honest "1 new insight"
// badge, which points here and dismisses on open.
const INSIGHT_KEY = "vega:previewInsightSeen";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold text-stone-800" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default function PreviewSavingsBanner() {
  const s = savingsBreakdown();
  const o = getOutreach();
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState(false);

  useEffect(() => {
    try {
      setBadge(!localStorage.getItem(INSIGHT_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setOpen((v) => !v);
    if (!open) {
      setBadge(false);
      try {
        localStorage.setItem(INSIGHT_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c85a1e]">Your numbers</p>
        {badge && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#c85a1e] px-2 py-0.5 text-[10px] font-bold text-white">
            <Sparkles size={11} /> 1 new insight
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-stone-500">
        Estimated monthly savings vs. delivery-app commissions
      </p>
      <p className="mt-1 text-3xl font-extrabold text-stone-900">
        {formatUsd(s.monthlySavings)}
        <span className="text-base font-medium text-stone-400">/mo</span>
      </p>

      <button
        type="button"
        onClick={toggle}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#c85a1e] hover:underline"
      >
        {open ? "Hide the breakdown" : "See the full breakdown"}
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <div className="mt-3 space-y-1.5 rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
          <Row label="Estimated orders / day" value={`${s.estimatedOrdersPerDay}`} />
          <Row label="× average order" value={formatUsd(s.avgOrderValue)} />
          <Row label="× ~30 days" value={`${s.monthlyOrders} orders/mo`} />
          <Row label="Monthly order revenue" value={formatUsd(s.monthlyGross)} />
          <Row label={`Delivery apps would take (${s.commissionPct}%)`} value={formatUsd(s.monthlySavings)} strong />
          <div className="my-1 border-t border-stone-200" />
          <Row label="That's per year" value={formatUsd(s.annualSavings)} strong />
          <p className="pt-2 text-xs leading-relaxed text-stone-500">
            Orders placed here are commission-free. The full system is{" "}
            <span className="font-semibold text-stone-700">{formatUsd(o.discountedPrice)}</span>{" "}
            one-time ({formatUsd(o.fullPrice)} value), less than a single year of a typical
            Toast/Square subscription.
          </p>
        </div>
      )}

      {/* Primary CTA: appears only once the breakdown is expanded — the moment
          the visitor has seen the strongest case. The smallest possible next
          step: one calm click, no urgency, no scheduling. */}
      {open && (
        <>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            Want this running for real? One click and I&apos;ll take it from here.
          </p>
          <PreviewInterestCheckbox variant="inline" />
        </>
      )}
    </div>
  );
}
