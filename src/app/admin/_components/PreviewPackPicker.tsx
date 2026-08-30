"use client";

import { useEffect, useState } from "react";
import { getOutreach, outreachEnabled, formatUsd } from "@/lib/outreach";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { PACKAGES, TIER_ORDER, type PackageTier } from "@/lib/packages";

// Tier picker for the trial popup. Lets the owner say WHICH plan fits in one tap
// - a stronger, more useful signal than a generic "yes". Tapping a tier fires the
// same best-effort interest signal to the builder CRM (POST /api/interest) with
// the chosen packageTier, so the agency sees exactly which plan they want. No
// payment here: it's a follow-up cue, matching the one-click interest pattern.
// Renders nothing unless the outreach layer is enabled.

const SESSION_KEY = "vega:interestTier";
const BRAND = "#c85a1e";

async function sendSignal(endpoint: string, key: string, siteUrl: string, packageTier: PackageTier) {
  const body = JSON.stringify({ key, siteUrl, interested: true, packageTier });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
      return;
    } catch {
      /* retry once, then give up silently */
    }
  }
}

export default function PreviewPackPicker() {
  const o = getOutreach();
  const [picked, setPicked] = useState<PackageTier | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved === "STARTER" || saved === "STANDARD" || saved === "PRO") setPicked(saved);
    } catch {
      /* ignore */
    }
  }, []);

  if (!outreachEnabled()) return null;

  const choose = (tier: PackageTier) => {
    setPicked(tier);
    try {
      sessionStorage.setItem(SESSION_KEY, tier);
    } catch {
      /* ignore */
    }
    sendSignal(o.signalEndpoint, o.signalKey, SITE_CONFIG.siteUrl, tier);
  };

  const pickedLabel = picked ? PACKAGES[picked].label : null;

  return (
    <div className="mt-4 rounded-2xl border border-[#c85a1e]/20 bg-[#fff7f2] p-4 dark:bg-[#241812]">
      <p className="text-sm font-semibold text-stone-700 dark:text-foreground">
        Which plan fits? <span className="font-normal text-stone-500 dark:text-muted-foreground">One tap - no call, I&apos;ll take it from here.</span>
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {TIER_ORDER.map((tier) => {
          const p = PACKAGES[tier];
          const active = picked === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => choose(tier)}
              aria-pressed={active}
              className="flex flex-col items-center rounded-xl border px-2 py-2.5 text-center transition-colors"
              style={{
                borderColor: active ? BRAND : "#e7e0da",
                backgroundColor: active ? BRAND : "#ffffff",
                color: active ? "#ffffff" : "#44403c",
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-wide">{p.label}</span>
              <span className="mt-0.5 text-base font-extrabold leading-none">{formatUsd(p.price)}</span>
              <span className={`text-[10px] ${active ? "text-white/80" : "text-stone-400"}`}>one-time</span>
            </button>
          );
        })}
      </div>

      {picked && (
        <p className="mt-3 text-sm font-medium leading-snug text-[#c85a1e]">
          Got it - I&apos;ll reach out about the {pickedLabel} plan. (Tap another to change.)
        </p>
      )}
    </div>
  );
}
