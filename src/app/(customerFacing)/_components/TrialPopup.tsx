"use client";

// "Built for you" popup shown ~7s after a prospect's demo site loads (only when
// SITE_CONFIG.outreach.enabled). It sells the current offer (the Regulars
// Engine): what they get, the founding-partner terms and the guarantee, all
// true and from config. Honest by design: no countdown, no fake spot counter,
// no takedown threats. Primary CTA opens the read-only dashboard preview; the
// one-click interest checkbox is the next step, which Ben follows up on.
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getOutreach, formatUsd } from "@/lib/outreach";
import { isTrialDismissed, markTrialDismissed, markTrialSeen } from "@/lib/trialPopupSession";
import PreviewInterestCheckbox from "@/app/admin/_components/PreviewInterestCheckbox";

const SHOW_AFTER_MS = 7000;

export default function TrialPopup() {
  const o = getOutreach();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!o.enabled) return;
    if (isTrialDismissed()) return;
    const t = setTimeout(() => {
      setOpen(true);
      // Mark it seen so the floating dashboard bubble can appear (and persist).
      markTrialSeen();
    }, SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [o.enabled]);

  if (!o.enabled || !open) return null;

  const dismiss = () => {
    setOpen(false);
    markTrialDismissed();
  };

  const points = [
    "Orders come straight to you, and you keep every customer's number.",
    "A card in every delivery bag brings app customers back to order here.",
    "I write and send your text offers for slow nights, every month.",
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`A message about the ${SITE_CONFIG.name} website`}
      onClick={dismiss}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card text-card-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c85a1e]">Built for {SITE_CONFIG.name}</p>
          <h2 className="mt-2 text-xl font-extrabold leading-snug text-foreground sm:text-2xl">
            Your own ordering site, ready to go live.
          </h2>

          <ul className="mt-4 space-y-2">
            {points.map((p) => (
              <li key={p} className="flex gap-2 text-sm leading-relaxed text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c85a1e]" />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-2xl bg-muted/60 p-3 text-sm leading-relaxed">
            <p className="font-semibold text-foreground">
              Founding partner: $0 setup, {formatUsd(o.founding.monthly)}/month, month to month.
            </p>
            <p className="mt-1 text-muted-foreground">
              For my first {o.founding.spots} restaurants, in return for a short video review. {o.guarantee.orders} direct orders in your first{" "}
              {o.guarantee.days} days, or I keep working for free until you get there.
            </p>
          </div>

          <a
            href="/api/preview/enter"
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#c85a1e] px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#b04d17]"
          >
            See your dashboard →
          </a>

          <PreviewInterestCheckbox variant="inlineSoft" source="website" />
        </div>
      </div>
    </div>
  );
}
