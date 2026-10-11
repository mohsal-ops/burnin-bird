"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Copy } from "lucide-react";
import { removeDoorDash, saveDoorDash, saveStrategy, setDoorDashActive } from "../_actions/courierActions";

export function CourierSettings(props: {
  uberConfigured: boolean;
  doordash: { saved: boolean; active: boolean; webhookUrl: string; webhookSecret: string };
  strategy: "cheapest" | "fastest";
}) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ developerId: "", keyId: "", signingSecret: "" });
  const confirm = useConfirm();
  const dd = props.doordash;
  const field = "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 font-mono text-sm outline-none focus:border-stone-800";
  const done = (r: { ok: true; message: string } | { ok: false; error: string }): void => {
    if (r.ok) toast.success(r.message);
    else toast.error(r.error);
  };
  const copy = (v: string) => navigator.clipboard.writeText(v).then(() => toast.success("Copied"));

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-5">
      <div>
        <p className="font-semibold text-stone-800">Couriers</p>
        <p className="mt-0.5 text-sm text-stone-500">
          Each delivery is quoted with every courier you have and goes to the{" "}
          <select
            className="rounded border border-stone-300 px-1 py-0.5 text-sm"
            defaultValue={props.strategy}
            disabled={pending}
            onChange={(e) => start(async () => done(await saveStrategy(e.target.value as "cheapest" | "fastest")))}
          >
            <option value="cheapest">cheapest</option>
            <option value="fastest">fastest</option>
          </select>{" "}
          one. If one courier can&apos;t take it, the other does.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-stone-800">Uber Direct</p>
          <p className="text-xs text-stone-500">{props.uberConfigured ? "Set up" : "Not set up on this site"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-stone-800">DoorDash Drive</p>
            <p className="text-xs text-stone-500">
              Your own DoorDash Drive account — DoorDash bills you directly per delivery.
            </p>
          </div>
          {dd.saved && (
            <input
              type="checkbox"
              className="h-5 w-5 accent-stone-900"
              checked={dd.active}
              disabled={pending}
              onChange={(e) => start(async () => done(await setDoorDashActive(e.target.checked)))}
            />
          )}
        </div>

        {dd.saved ? (
          <div className="space-y-2 text-sm">
            <p className="text-stone-600">In the DoorDash Developer Portal → Webhooks, add:</p>
            {[
              ["Endpoint URL", dd.webhookUrl],
              ["Authorization header", dd.webhookSecret],
            ].map(([label, v]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-40 shrink-0 text-xs text-stone-500">{label}</span>
                <code className="min-w-0 flex-1 truncate rounded bg-stone-50 px-2 py-1 text-xs">{v}</code>
                <button type="button" onClick={() => copy(v)} className="text-stone-500 hover:text-stone-800" aria-label={`Copy ${label}`}>
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={async () => {
                if (await confirm({ title: "Remove DoorDash?", description: "Deliveries will use Uber only.", confirmText: "Remove", destructive: true }))
                  start(async () => done(await removeDoorDash()));
              }}
            >
              Remove DoorDash
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <input className={field} placeholder="Developer ID" value={form.developerId} onChange={(e) => setForm({ ...form, developerId: e.target.value })} />
            <input className={field} placeholder="Key ID" value={form.keyId} onChange={(e) => setForm({ ...form, keyId: e.target.value })} />
            <input
              className={field}
              type="password"
              placeholder="Signing secret"
              value={form.signingSecret}
              onChange={(e) => setForm({ ...form, signingSecret: e.target.value })}
            />
            <Button
              size="sm"
              disabled={pending || !form.developerId || !form.keyId || !form.signingSecret}
              onClick={() =>
                start(async () => {
                  const r = await saveDoorDash(form);
                  done(r);
                  if (r.ok) setForm({ developerId: "", keyId: "", signingSecret: "" });
                })
              }
            >
              Connect DoorDash
            </Button>
            <p className="text-xs text-stone-500">
              developer.doordash.com → Developer Portal → Credentials → create an access key (Production for real
              orders, Sandbox to test).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
