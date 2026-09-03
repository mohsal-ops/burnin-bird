"use client";

// Trial pitch popup shown ~7s after the customer site loads. Honest by design:
// no countdown, no fake spot-counter, no expiry/takedown copy, no pricing. It's
// built specifically for the restaurant, real scarcity (I take on a handful at a
// time). Primary CTA opens the read-only dashboard preview; a single low-friction
// interest checkbox is the next step - a signal I follow up on personally.
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getOutreach } from "@/lib/outreach";
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

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`A message about the ${SITE_CONFIG.name} website`}
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card text-card-foreground shadow-2xl"
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
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c85a1e]">
            Built for you
          </p>
          <h2 className="mt-2 text-xl font-extrabold leading-snug text-foreground sm:text-2xl">
            This site and dashboard were built specifically for {SITE_CONFIG.name}.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            It&apos;s a live trial, yours to explore for free, for as long as you
            like. I&apos;m offering it at a discount right now since I&apos;m still
            building reviews for my own business, so I&apos;d rather get it into a
            few real restaurants&apos; hands than charge full price.
          </p>

          {/* Real scarcity, no fake counter */}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            I build and manage each of these personally, so I only take on a handful
            of restaurants at a time.
          </p>

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
