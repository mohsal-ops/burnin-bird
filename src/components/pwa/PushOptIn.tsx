"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { isPushSubscribed, subscribePush, unsubscribePush, type SubscribeResult } from "@/lib/pwa/client";

// One button, two uses:
//   customer (success page) → "Notify me when my order is ready / on the way"
//   owner (admin → Orders)  → "New-order alerts on this device"
// Only rendered when the "web_push" flag is on. Asks for permission ONLY on
// click (required by iOS and good manners everywhere).

const MESSAGES: Record<Exclude<SubscribeResult, "ok">, string> = {
  denied: "Notifications are blocked for this site in your browser settings.",
  unsupported: "This browser can't show notifications.",
  ios_needs_install: "On iPhone: tap Share → “Add to Home Screen”, open it from there, then tap this again.",
  error: "Couldn't turn on notifications. Try again.",
};

export default function PushOptIn({
  audience,
  cartId,
  label,
  className = "",
}: {
  audience: "owner" | "customer";
  cartId?: string;
  label: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "on" | SubscribeResult>("idle");
  // Already on for this device? (Otherwise the button asked again every visit.)
  useEffect(() => {
    void isPushSubscribed().then((on) => {
      if (on) setState((s) => (s === "idle" ? "on" : s));
    });
  }, []);
  const msg = state !== "idle" && state !== "busy" && state !== "on" && state !== "ok" ? MESSAGES[state] : "";
  const consent =
    audience === "customer"
      ? "We'll only send updates about this order. No ads. You can turn it off any time."
      : "Alerts for new orders on this device only. You can turn it off any time.";

  return (
    <div className={className}>
      <button
        type="button"
        disabled={state === "busy" || state === "on"}
        onClick={async () => {
          setState("busy");
          const r = await subscribePush(audience, cartId);
          setState(r === "ok" ? "on" : r);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-current px-4 py-2 text-sm font-medium disabled:opacity-70"
      >
        {state === "on" ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {state === "on" ? "Notifications on" : state === "busy" ? "Turning on…" : label}
      </button>
      {state === "idle" && <p className="mt-1.5 max-w-xs text-xs opacity-70">{consent}</p>}
      {state === "on" && (
        <button
          type="button"
          className="mt-1.5 text-xs underline opacity-70"
          onClick={async () => {
            await unsubscribePush();
            setState("idle");
          }}
        >
          Turn off
        </button>
      )}
      {msg && <p className="mt-2 max-w-xs text-xs opacity-80">{msg}</p>}
    </div>
  );
}
