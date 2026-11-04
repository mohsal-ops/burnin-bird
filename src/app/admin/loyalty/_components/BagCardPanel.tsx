"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Star, ShoppingBag } from "lucide-react";
import { saveBagCardCode, disableBagCardCode, saveGoogleReviewUrl } from "../_actions/loyaltyActions";

// Bag card + reviews (offer v3). The bag card is the card that goes in every
// delivery and takeout bag: "Next time, order straight from us", a QR and a code.
// The code set here works at checkout and never expires while it's on. The QR
// opens the site with ?ref=bag&code=..., which greets them and fills the code.
export function BagCardPanel({
  code,
  discountPercent,
  active,
  redemptions,
  siteUrl,
  qrDataUrl,
  googleReviewUrl,
}: {
  code: string | null;
  discountPercent: number;
  active: boolean;
  redemptions: number;
  siteUrl: string;
  qrDataUrl: string | null;
  googleReviewUrl: string;
}) {
  const [codeIn, setCodeIn] = useState(code ?? "DIRECT");
  const [pct, setPct] = useState(String(discountPercent || 10));
  const [review, setReview] = useState(googleReviewUrl);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const link = active && code ? `${siteUrl.replace(/\/$/, "")}/?ref=bag&code=${encodeURIComponent(code)}` : null;

  const save = () =>
    start(async () => {
      const r = await saveBagCardCode({ code: codeIn, discountPercent: Number(pct) });
      setMsg(r.ok ? { ok: true, text: "Saved. The code works at checkout now." } : { ok: false, text: r.error });
    });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-stone-700" />
          <h2 className="text-base font-semibold text-stone-900">Bag card code</h2>
          {active ? (
            <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">On</span>
          ) : (
            <span className="ml-auto rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">Off</span>
          )}
        </div>
        <p className="mt-1 text-sm text-stone-500">
          Printed on the card in every delivery and takeout bag. Customers scan it, order from your site and use the code. It doesn&apos;t expire.
        </p>
        <div className="mt-4 grid grid-cols-[1fr_7rem] gap-2">
          <label className="text-xs font-medium text-stone-600">
            Code
            <input value={codeIn} onChange={(e) => setCodeIn(e.target.value.toUpperCase())} maxLength={16}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm uppercase" />
          </label>
          <label className="text-xs font-medium text-stone-600">
            % off
            <input value={pct} onChange={(e) => setPct(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={save} disabled={pending} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {active ? "Update code" : "Turn on"}
          </button>
          {active && (
            <button
              onClick={() => start(async () => { await disableBagCardCode(); setMsg({ ok: true, text: "Turned off." }); })}
              disabled={pending}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:opacity-50"
            >
              Turn off
            </button>
          )}
          {redemptions > 0 && <span className="text-sm text-stone-500">Used on {redemptions} order{redemptions === 1 ? "" : "s"}</span>}
        </div>
        {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
        {link && (
          <div className="mt-4 flex items-center gap-4 rounded-xl bg-stone-50 p-3">
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Bag card QR code" className="size-24 rounded-md bg-white p-1" />
            )}
            <div className="min-w-0 text-sm">
              <p className="font-medium text-stone-800">The card&apos;s QR link</p>
              <p className="truncate text-xs text-stone-500">{link}</p>
              <button
                onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* blocked */ } }}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-stone-700"
              >
                {copied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />} {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Star className="size-5 text-amber-500" />
          <h2 className="text-base font-semibold text-stone-900">Google review button</h2>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          After an order, customers see &quot;Loved it? Leave us a review&quot; with this link. Find it in your Google Business Profile: Ask for reviews, then copy the link.
        </p>
        <input value={review} onChange={(e) => setReview(e.target.value)} placeholder="https://g.page/r/..."
          className="mt-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <button
          onClick={() => start(async () => { const r = await saveGoogleReviewUrl(review); setMsg(r.ok ? { ok: true, text: review.trim() ? "Review link saved." : "Review button removed." } : { ok: false, text: r.error }); })}
          disabled={pending}
          className="mt-3 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Save link
        </button>
      </section>
    </div>
  );
}
