"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveUberDirect } from "../_actions/deliveryActions";
import type { UberDirectMode, UberDirectSettings } from "@/lib/siteSettings";

const MODES: { value: UberDirectMode; label: string }[] = [
  { value: "both", label: "Pickup and delivery" },
  { value: "delivery_only", label: "Delivery only" },
  { value: "pickup_only", label: "Pickup only" },
];

export function DeliverySettingsForm({ initial }: { initial: UberDirectSettings }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [mode, setMode] = useState<UberDirectMode>(initial.mode);
  const [msg, setMsg] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const save = () => {
    setMsg("");
    startTransition(async () => {
      const res = await saveUberDirect({ enabled, mode });
      setMsg(res.ok ? "Saved." : res.error || "Couldn't save.");
    });
  };

  return (
    <div className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-6">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-primary"
        />
        <span>
          <span className="font-semibold text-foreground">Enable Uber Direct delivery</span>
          <span className="block text-sm text-muted-foreground">
            When on, delivery orders get a live courier quote at checkout and a courier is dispatched
            after payment.
          </span>
        </span>
      </label>

      <div className={enabled ? "" : "pointer-events-none opacity-50"}>
        <p className="mb-2 text-sm font-semibold text-foreground">Order options offered to customers</p>
        <div className="flex flex-col gap-2">
          {MODES.map((m) => (
            <label key={m.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="uber_mode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
                className="h-4 w-4 accent-primary"
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending} variant="mainButton">
          {pending ? "Saving…" : "Save"}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
