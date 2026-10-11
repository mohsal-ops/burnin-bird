"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Copy } from "lucide-react";
import { removeDoorDash, saveDoorDash, savePolicy, setDoorDashActive, testDoorDash } from "../_actions/courierActions";
import { testUberDirect } from "../_actions/deliveryActions";

type Strategy = "cheapest" | "fastest" | "preferred";
type ProviderId = "uber_direct" | "doordash_drive";
type LogRow = {
  id: string;
  at: string;
  provider: string;
  customerFeeCents: number | null;
  courierFeeCents: number | null;
  status: string | null;
};
const NAMES: Record<string, string> = { uber_direct: "Uber", doordash_drive: "DoorDash" };
const usd = (c: number | null) => (c == null ? "-" : `$${(c / 100).toFixed(2)}`);

export function CourierSettings(props: {
  uberConfigured: boolean;
  doordash: { saved: boolean; active: boolean; webhookUrl: string; webhookSecret: string };
  policy: { strategy: Strategy; preferred: ProviderId | null; subsidyCents: number };
  log: LogRow[];
}) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ developerId: "", keyId: "", signingSecret: "" });
  const [policy, setPolicy] = useState({ ...props.policy, subsidy: (props.policy.subsidyCents / 100).toFixed(2) });
  const confirm = useConfirm();
  const dd = props.doordash;
  const field = "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 font-mono text-sm outline-none focus:border-stone-800";
  const done = (r: { ok: true; message: string } | { ok: false; error: string }): void => {
    if (r.ok) toast.success(r.message);
    else toast.error(r.error);
  };
  const copy = (v: string) => navigator.clipboard.writeText(v).then(() => toast.success("Copied"));

  return (
    <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="font-semibold text-stone-800">Couriers</p>
        <p className="mt-0.5 text-sm text-stone-500">
          Every delivery is quoted with each courier you have. If the chosen one can&apos;t take it, the other one gets
          one try. Choice uses price, arrival time and availability only.
        </p>
      </div>

      {/* routing policy */}
      <div className="grid gap-3 rounded-xl border border-stone-200 p-4 text-sm sm:grid-cols-3">
        <label className="space-y-1">
          <span className="block text-xs text-stone-500">Pick the courier that is</span>
          <select
            className="w-full rounded-lg border border-stone-300 px-2 py-2"
            value={policy.strategy}
            onChange={(e) => setPolicy({ ...policy, strategy: e.target.value as Strategy })}
          >
            <option value="cheapest">Cheapest</option>
            <option value="fastest">Fastest arrival</option>
            <option value="preferred">My favourite, else cheapest</option>
          </select>
        </label>
        {policy.strategy === "preferred" && (
          <label className="space-y-1">
            <span className="block text-xs text-stone-500">Favourite courier</span>
            <select
              className="w-full rounded-lg border border-stone-300 px-2 py-2"
              value={policy.preferred ?? ""}
              onChange={(e) => setPolicy({ ...policy, preferred: (e.target.value || null) as ProviderId | null })}
            >
              <option value="">Choose…</option>
              <option value="uber_direct">Uber</option>
              <option value="doordash_drive">DoorDash</option>
            </select>
          </label>
        )}
        <label className="space-y-1">
          <span className="block text-xs text-stone-500">I pay this much of each delivery fee</span>
          <div className="flex items-center gap-1">
            $
            <input
              type="number"
              min={0}
              step="0.5"
              className="w-24 rounded-lg border border-stone-300 px-2 py-2"
              value={policy.subsidy}
              onChange={(e) => setPolicy({ ...policy, subsidy: e.target.value })}
            />
          </div>
        </label>
        <div className="sm:col-span-3">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () =>
                done(
                  await savePolicy({
                    strategy: policy.strategy,
                    preferred: policy.preferred,
                    subsidyCents: Math.round(Number(policy.subsidy || 0) * 100),
                  }),
                ),
              )
            }
          >
            Save routing
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-stone-800">Uber Direct</p>
          <p className="text-xs text-stone-500">{props.uberConfigured ? "Set up" : "Not set up on this site"}</p>
        </div>
        {props.uberConfigured && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await testUberDirect();
                done(r.ok ? { ok: true, message: r.message } : { ok: false, error: r.message });
              })
            }
          >
            Test
          </Button>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-stone-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-stone-800">DoorDash Drive</p>
            <p className="text-xs text-stone-500">Your own DoorDash Drive account. DoorDash bills you directly per delivery.</p>
          </div>
          {dd.saved && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => done(await testDoorDash()))}>
                Test
              </Button>
              <input
                type="checkbox"
                aria-label="Use DoorDash"
                className="h-5 w-5 accent-stone-900"
                checked={dd.active}
                disabled={pending}
                onChange={(e) => start(async () => done(await setDoorDashActive(e.target.checked)))}
              />
            </div>
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
              developer.doordash.com → Developer Portal → Credentials → create an access key (Production for real orders,
              Sandbox to test).
            </p>
          </div>
        )}
      </div>

      {/* delivery log */}
      {props.log.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-stone-800">Recent deliveries</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-stone-500">
                <tr>
                  <th className="py-1 pr-3 font-normal">When</th>
                  <th className="py-1 pr-3 font-normal">Courier</th>
                  <th className="py-1 pr-3 font-normal">Customer paid</th>
                  <th className="py-1 pr-3 font-normal">Courier cost</th>
                  <th className="py-1 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {props.log.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 pr-3 text-stone-600">{new Date(r.at).toLocaleString()}</td>
                    <td className="py-1.5 pr-3">{NAMES[r.provider] ?? r.provider}</td>
                    <td className="py-1.5 pr-3">{usd(r.customerFeeCents)}</td>
                    <td className="py-1.5 pr-3">{usd(r.courierFeeCents)}</td>
                    <td className="py-1.5 capitalize text-stone-600">{(r.status ?? "pending").replace(/_/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
