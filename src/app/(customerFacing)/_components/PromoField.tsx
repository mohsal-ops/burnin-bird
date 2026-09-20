"use client";

import { useState } from "react";
import { Tag, X, Loader2 } from "lucide-react";

// Checkout promo-code field. Validates a loyalty campaign code against the
// server (POST /api/cart/promo), which stores it on the cart; then reloads so
// the payment intent is recreated with the discount applied. A completed order
// with the code attached counts as a redemption (see finalizeCart).
export function PromoField({
  appliedCode,
  discountInCents,
}: {
  appliedCode: string | null;
  discountInCents: number;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const apply = async (value: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/cart/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (value && !data.valid) {
        setError(data.error || "That code isn't valid.");
        setBusy(false);
        return;
      }
      // Reload so the server re-renders the payment intent with the new total.
      window.location.reload();
    } catch {
      setError("Something went wrong. Try again.");
      setBusy(false);
    }
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm">
        <span className="inline-flex items-center gap-2 font-medium text-green-800">
          <Tag className="size-4" /> {appliedCode} applied
          {discountInCents > 0 && <span className="text-green-600">- you save ${(discountInCents / 100).toFixed(2)}</span>}
        </span>
        <button
          type="button"
          onClick={() => apply("")}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && code.trim() && apply(code)}
            placeholder="Have a promo code?"
            className="w-full rounded-lg border border-stone-200 py-2 pl-8 pr-3 text-sm uppercase outline-none focus:ring-2 focus:ring-stone-300"
            aria-label="Promo code"
          />
        </div>
        <button
          type="button"
          onClick={() => code.trim() && apply(code)}
          disabled={busy || !code.trim()}
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-900 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
