"use client";

// Trial pitch popup shown ~5s after the customer site loads. Honest by design:
// no countdown, no fake spot-counter, no expiry/takedown copy. Shows both the
// real value and the discounted price, an honest reason for the discount, and
// real scarcity (I take on a handful at a time). Primary CTA opens the read-only
// dashboard preview; an optional secondary link books a call.
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getOutreach, formatUsd, savingsBreakdown } from "@/lib/outreach";

const DISMISS_KEY = "vega:trialPopupDismissed";
const SHOW_AFTER_MS = 5000;

export default function TrialPopup() {
  const o = getOutreach();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!o.enabled) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [o.enabled]);

  if (!o.enabled || !open) return null;

  const dismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const { annualSavings } = savingsBreakdown();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`A message about the ${SITE_CONFIG.name} website`}
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-stone-100 text-stone-600 transition-colors hover:bg-stone-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c85a1e]">
            Built for you
          </p>
          <h2 className="mt-2 text-xl font-extrabold leading-snug text-stone-900 sm:text-2xl">
            This site and dashboard were built specifically for {SITE_CONFIG.name}.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            It&apos;s a live trial, yours to explore for free, for as long as you
            like. I&apos;m offering it at a discount right now since I&apos;m still
            building reviews for my own business, so I&apos;d rather get it into a
            few real restaurants&apos; hands than charge full price.
          </p>

          {/* Both prices — real value vs. the offer */}
          <div className="mt-5 flex items-baseline gap-3 rounded-2xl bg-stone-50 px-4 py-3">
            <span className="text-sm text-stone-400 line-through">
              {formatUsd(o.fullPrice)}
            </span>
            <span className="text-2xl font-extrabold text-stone-900">
              {formatUsd(o.discountedPrice)}
            </span>
            <span className="text-xs text-stone-500">one-time</span>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Less than a single year of what a typical Toast/Square setup runs
            ($150–500/month). It could save you around {formatUsd(annualSavings)} a
            year vs. paying delivery-app commissions.
          </p>

          {/* Real scarcity, no fake counter */}
          <p className="mt-4 text-xs leading-relaxed text-stone-500">
            I build and manage each of these personally, so I only take on a handful
            of restaurants at a time.
          </p>

          <a
            href="/api/preview/enter"
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#c85a1e] px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#b04d17]"
          >
            See your dashboard →
          </a>

          {o.calendlyUrl ? (
            <a
              href={o.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-sm font-medium text-stone-500 underline-offset-2 hover:text-stone-700 hover:underline"
            >
              Prefer to talk it through? Book a quick call
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
