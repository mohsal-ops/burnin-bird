"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setAppFeature } from "../appActions";

type Flag = { on: boolean; killed: boolean };

export function AppToggles({ pwa, push, native, owners, customers }: { pwa: Flag; push: Flag; native: Flag; owners: number; customers: number }) {
  const [pending, start] = useTransition();
  const row = (flag: "pwa" | "web_push" | "native_app", f: Flag, title: string, desc: string) => (
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
        `Customers who tap “Notify me” get order updates; you get new-order alerts (Orders page). ${owners} of your devices and ${customers} customer devices signed up.`,
      )}
      {row("native_app", native, "Your App Store app", "Only if you bought the native app add-on: lets your iPhone/Android app load the menu and send orders.")}
    </div>
  );
}
