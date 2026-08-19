"use client";

import { useEffect, useState } from "react";
import { getOutreach } from "@/lib/outreach";

// One-click "yes, I'm interested" signal — the smallest possible next step,
// replacing the old "book a call" CTA everywhere it appeared.
//
// The check itself IS the action (no submit button). Checking shows an instant,
// satisfying confirmation and fires a best-effort background signal to the
// builder CRM (POST /api/interest, keyed by this client's slug). Unchecking is
// "changed my mind" — it clears the signal. The checked state lives in
// sessionStorage so it survives navigating between preview pages in the same
// session. Renders nothing unless `signalKey` is configured for this client.

const SESSION_KEY = "vega:interest";
const BRAND = "#c85a1e";

async function sendSignal(endpoint: string, key: string, interested: boolean) {
  const body = JSON.stringify({ key, interested });
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

  if (!o.signalKey) return null;

  const toggle = () => {
    const next = !checked;
    setChecked(next);
    try {
      if (next) sessionStorage.setItem(SESSION_KEY, "1");
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    sendSignal(o.signalEndpoint, o.signalKey, next);
  };

  const inner = (
    <>
      <label className="flex cursor-pointer select-none items-start gap-3">
        <span
          className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
          style={{
            borderColor: checked ? BRAND : "#d6d3d1",
            backgroundColor: checked ? BRAND : "#ffffff",
            animation: checked ? "vegaPop 0.28s ease" : undefined,
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

  const keyframes = (
    <style>{`
      @keyframes vegaCheckDraw { from { stroke-dashoffset: 22 } to { stroke-dashoffset: 0 } }
      @keyframes vegaPop { 0%{transform:scale(0.85)} 60%{transform:scale(1.12)} 100%{transform:scale(1)} }
      @keyframes vegaRise { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    `}</style>
  );

  if (variant === "bubble") {
    return (
      <>
        {keyframes}
        <div className="fixed bottom-4 right-4 z-40 max-w-[280px] rounded-2xl border border-stone-200 bg-white/95 p-3.5 shadow-md backdrop-blur">
          {inner}
        </div>
      </>
    );
  }

  return (
    <>
      {keyframes}
      <div className="mt-4 rounded-2xl border border-[#c85a1e]/20 bg-[#fff7f2] p-4">{inner}</div>
    </>
  );
}
