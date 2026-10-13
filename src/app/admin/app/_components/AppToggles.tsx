"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { sendTestOwnerAlert, setAppFeature } from "../appActions";
import PushOptIn from "@/components/pwa/PushOptIn";

type Flag = { on: boolean; killed: boolean };

export function AppToggles({ pwa, push, native, accounts, owners, customers }: { pwa: Flag; push: Flag; native: Flag; accounts: Flag; owners: number; customers: number }) {
  const [pending, start] = useTransition();
  const row = (flag: "pwa" | "web_push" | "native_app" | "customer_accounts", f: Flag, title: string, desc: string) => (
    <label className="flex items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-stone-800">{title}</span>
        <span className="block text-xs text-stone-500">{f.killed ? "Switched off by Starvega support." : desc}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 accent-stone-900"
        checked={f.on}
        disabled={pending || f.killed}
        onChange={(e) =>
          start(async () => {
            const r = await setAppFeature(flag, e.target.checked);
            if (r.ok) toast.success(e.target.checked ? "Turned on" : "Turned off");
            else toast.error(r.error);
          })
        }
      />
    </label>
  );
  return (
    <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white px-5 shadow-sm">
      {row("pwa", pwa, "Add-to-home-screen app", "Shows a small “install” card to returning customers and after their first order.")}
      {row(
        "web_push",
        push,
        "Order notifications",
        `Customers who tap “Notify me” get order updates; you get new-order alerts on your phone. ${owners} of your devices and ${customers} customer devices signed up.`,
      )}
      {push.on && (
        <div className="py-4">
          <span className="block text-sm font-medium text-stone-800">Alerts on this phone</span>
          <span className="mb-3 block text-xs text-stone-500">
            Turn on once per phone. Works even when the app is closed (paid online orders). On iPhone, open the app from the Home Screen first.
          </span>
          <div className="flex flex-wrap items-start gap-3">
            <PushOptIn audience="owner" label="Turn on alerts on this phone" className="text-stone-700" />
            <button
              type="button"
              disabled={pending}
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              onClick={() =>
                start(async () => {
                  const r = await sendTestOwnerAlert();
                  if (!r.ok) toast.error(r.error);
                  else if (r.sent === 0) toast.error("No phone is signed up yet. Tap “Turn on alerts on this phone” first.");
                  else toast.success(`Test alert sent to ${r.sent} device${r.sent > 1 ? "s" : ""}. Check your phone.`);
                })
              }
            >
              Send test alert
            </button>
          </div>
        </div>
      )}
      {row("customer_accounts", accounts, "Customer sign-in", "Optional. Customers sign in with a code we email them (no password) to see past orders and order again. Guests can still order without it.")}
      {row("native_app", native, "Your App Store app", "Only if you bought the native app add-on: lets your iPhone/Android app load the menu and send orders.")}
    </div>
  );
}
