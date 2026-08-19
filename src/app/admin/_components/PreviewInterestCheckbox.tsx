"use client";

import { useEffect, useState } from "react";
import { getOutreach, outreachEnabled } from "@/lib/outreach";
import { SITE_CONFIG } from "@/lib/siteConfig";

// One-click "yes, I'm interested" signal — the smallest possible next step,
// replacing the old "book a call" CTA everywhere it appeared.
//
// The check itself IS the action (no submit button). Checking shows an instant,
// satisfying confirmation and fires a best-effort background signal to the
// builder CRM (POST /api/interest). The builder identifies this client from the
// request Origin (its vercel subdomain) — an optional `signalKey` override is
// sent too. Unchecking is "changed my mind" — it clears the signal. The checked
// state lives in sessionStorage so it survives navigating between preview pages
// in the same session. Renders nothing unless the outreach layer is enabled.

const SESSION_KEY = "vega:interest";
const BRAND = "#c85a1e";

async function sendSignal(
  endpoint: string,
  key: string,
  siteUrl: string,
  interested: boolean,
) {
  const body = JSON.stringify({ key, siteUrl, interested });
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
      // retry once, then give up silently — the UI has already confirmed and we
      // never want a network hiccup to surface an error to the lead.
    }
  }
}

export default function PreviewInterestCheckbox({
  variant = "inline",
}: {
  variant?: "inline" | "bubble";
}) {
  const o = getOutreach();
  const [checked, setChecked] = useState(false);

  // Restore the "yes" for the rest of this session (persists across navigation).
  useEffect(() => {
    try {
      setChecked(sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (!outreachEnabled()) return null;

  const toggle = () => {
    const next = !checked;
    setChecked(next);
    try {
      if (next) sessionStorage.setItem(SESSION_KEY, "1");
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    sendSignal(o.signalEndpoint, o.signalKey, SITE_CONFIG.siteUrl, next);
  };

  const keyframes = (
    <style>{`
      @keyframes vegaCheckDraw { from { stroke-dashoffset: 22 } to { stroke-dashoffset: 0 } }
      @keyframes vegaPop { 0%{transform:scale(0.97)} 60%{transform:scale(1.02)} 100%{transform:scale(1)} }
      @keyframes vegaPopSm { 0%{transform:scale(0.85)} 60%{transform:scale(1.12)} 100%{transform:scale(1)} }
      @keyframes vegaRise { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    `}</style>
  );

  // ── Bubble variant (persistent corner pill) — unchanged, low-key by design ──
  if (variant === "bubble") {
    const inner = (
      <>
        <label className="flex cursor-pointer select-none items-start gap-3">
          <span
            className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
            style={{
              borderColor: checked ? BRAND : "#d6d3d1",
              backgroundColor: checked ? BRAND : "#ffffff",
              animation: checked ? "vegaPopSm 0.28s ease" : undefined,
            }}
          >
            <input type="checkbox" checked={checked} onChange={toggle} className="sr-only" />
            {checked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 12.5 L10 18 L20 6"
                  stroke="#ffffff"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={22}
                  style={{ animation: "vegaCheckDraw 0.3s ease forwards" }}
                />
              </svg>
            )}
          </span>
          <span className="text-sm font-medium leading-snug text-stone-700">
            Yes — I want this live for my restaurant
          </span>
        </label>

        {checked && (
          <p
            className="mt-2 pl-8 text-sm font-medium leading-snug text-[#c85a1e]"
            style={{ animation: "vegaRise 0.3s ease" }}
          >
            Got it! I&apos;ll reach out on Instagram shortly.
          </p>
        )}
      </>
    );

    return (
      <>
        {keyframes}
        <div className="fixed bottom-4 right-4 z-40 max-w-[280px] rounded-2xl border border-stone-200 bg-white/95 p-3.5 shadow-md backdrop-blur">
          {inner}
        </div>
      </>
    );
  }

  // ── Inline variant (primary dashboard CTA) — full-weight, whole-card clickable ──
  const label = checked
    ? "Got it! I'll reach out on Instagram shortly."
    : "Yes — I want this live for my restaurant";
  const subline = checked
    ? "Consider it done — no call, no forms. (Tap to undo.)"
    : "One tap — I'll take it from here, no call needed.";

  return (
    <>
      {keyframes}
      <label
        className={`mt-4 block w-full cursor-pointer select-none rounded-2xl p-5 text-left shadow-sm transition active:scale-[0.99] ${
          checked ? "bg-[#1a6b3c]" : "bg-[#c85a1e] hover:bg-[#b04d17]"
        }`}
        style={checked ? { animation: "vegaPop 0.28s ease" } : undefined}
      >
        <input type="checkbox" checked={checked} onChange={toggle} className="sr-only" />
        <div className="flex items-center gap-3">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center ${
              checked ? "rounded-full bg-white" : "rounded-md border-2 border-white/70 bg-white/10"
            }`}
          >
            {checked && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 12.5 L10 18 L20 6"
                  stroke="#1a6b3c"
                  strokeWidth={3.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={22}
                  style={{ animation: "vegaCheckDraw 0.3s ease forwards" }}
                />
              </svg>
            )}
          </span>
          <span className={`text-base leading-snug text-white ${checked ? "font-bold" : "font-semibold"}`}>
            {label}
          </span>
        </div>
        <p className="mt-1.5 pl-9 text-sm text-white/80">{subline}</p>
      </label>
    </>
  );
}
