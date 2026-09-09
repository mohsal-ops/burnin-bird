"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { saveUberDirect } from "../_actions/deliveryActions";
import type { UberDirectMode, UberDirectSettings } from "@/lib/siteSettings";
import { Truck, Check } from "lucide-react";
import { toast } from "sonner";

const MODES: { value: UberDirectMode; label: string; desc: string }[] = [
  { value: "both", label: "Pickup & delivery", desc: "Customers pick either at checkout." },
  { value: "delivery_only", label: "Delivery only", desc: "Every order is couriered." },
  { value: "pickup_only", label: "Pickup only", desc: "Customers collect in store." },
];

export function DeliverySettingsForm({ initial }: { initial: UberDirectSettings }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [mode, setMode] = useState<UberDirectMode>(initial.mode);
  const [pending, startTransition] = useTransition();

  // Delivery on this platform IS Uber Direct - so pickup/delivery options only
  // matter once it's on. Turning it off falls back to pickup-only.
  const toggle = () =>
    setEnabled((v) => {
      const next = !v;
      if (!next) setMode("pickup_only");
      return next;
    });

  const save = () =>
    startTransition(async () => {
      const res = await saveUberDirect({ enabled, mode });
      if (res.ok) toast.success("Delivery settings saved");
      else toast.error(res.error || "Couldn't save.");
    });

  return (
    <div className="space-y-4">
      {/* Delivery on/off */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c85a1e]/10 text-[#c85a1e]">
              <Truck size={20} />
            </span>
            <div>
              <p className="font-semibold text-stone-800">Offer delivery (Uber Direct)</p>
              <p className="mt-0.5 text-sm text-stone-500">
                A real Uber courier is dispatched after payment - no marketplace, no commission.
                Needs your Uber Direct credentials; if none is available the order falls back to pickup.
              </p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={toggle}
            aria-label="Offer delivery"
            className="mt-1 data-[state=checked]:bg-[#c85a1e] data-[state=unchecked]:bg-stone-300"
          />
        </div>
      </div>

      {/* What customers can order */}
      <div
        className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-opacity ${
          enabled ? "" : "opacity-70"
        }`}
      >
        <p className="font-semibold text-stone-800">What customers can order</p>
        <p className="mb-3 mt-0.5 text-sm text-stone-500">
          {enabled
            ? "Choose which options appear at checkout."
            : "Delivery is off, so the site is pickup-only. Turn on delivery above to change this."}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map((m) => {
            const active = mode === m.value;
            const locked = !enabled && m.value !== "pickup_only";
            return (
              <button
                key={m.value}
                type="button"
                disabled={locked}
                onClick={() => setMode(m.value)}
                className={`rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "border-[#c85a1e] bg-[#c85a1e]/5 ring-1 ring-[#c85a1e]"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-800">{m.label}</span>
                  {active && <Check size={16} className="text-[#c85a1e]" />}
                </div>
                <span className="mt-0.5 block text-xs text-stone-500">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={save} disabled={pending} variant="mainButton" size="md">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
