"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { AlertTriangle, CheckCircle2, PlugZap, RefreshCw, Store } from "lucide-react";
import {
  applyPosMenu,
  connectSquareSandboxToken,
  disconnectPos,
  listPosLocations,
  previewPosMenu,
  resolvePosOrder,
  retryPosOrder,
  sendPosTestOrder,
  selectPosLocation,
  setPosFeature,
  type PreviewRow,
} from "../_actions/posActions";

type Provider = { id: string; label: string; support: "built" | "built_needs_approval" | "scaffold"; configured: boolean };
type Connection = {
  provider: string;
  label: string;
  environment: string;
  status: string;
  lastError: string | null;
  locationId: string | null;
  hasMerchant: boolean;
  lastMenuSyncAt: string | null;
};
type Flag = { on: boolean; killed: boolean; label: string };
type Sync = {
  id: string;
  cartId: string;
  provider: string;
  status: string;
  attempts: number;
  lastError: string | null;
  posOrderId: string | null;
  createdAt: string;
};

const card = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm";
const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-50 text-emerald-700",
  pending: "bg-stone-100 text-stone-600",
  failed: "bg-amber-50 text-amber-700",
  manual: "bg-red-50 text-red-700",
  resolved: "bg-stone-100 text-stone-500",
};
const STATUS_LABEL: Record<string, string> = {
  sent: "In POS",
  pending: "Sending",
  failed: "Retrying",
  manual: "Enter by hand",
  resolved: "Entered by hand",
};

export function PosPanel(props: {
  notice: { ok: boolean; text: string } | null;
  providers: Provider[];
  connection: Connection | null;
  flags: { pos_push: Flag; pos_menu_sync: Flag };
  syncs: Sync[];
  unmapped: string[];
}) {
  const { connection: conn, flags } = props;
  const [pending, start] = useTransition();
  const [env, setEnv] = useState<"sandbox" | "production">("sandbox");
  const [token, setToken] = useState("");
  const [locations, setLocations] = useState<{ id: string; name: string }[] | null>(null);
  const [preview, setPreview] = useState<{
    counts: { update: number; same: number; create: number; notInPos: number };
    rows: PreviewRow[];
    notInPos: string[];
  } | null>(null);
  const [createNew, setCreateNew] = useState(false);
  const confirm = useConfirm();

  const run = <T,>(fn: () => Promise<({ ok: true } & T) | { ok: false; error: string }>, done?: (r: T) => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) done?.(r as T);
      else toast.error(r.error);
    });

  const toggle = (flag: "pos_push" | "pos_menu_sync", on: boolean) =>
    run(() => setPosFeature(flag, on), () => toast.success(on ? "Turned on" : "Turned off"));

  return (
    <div className="space-y-4">
      {props.notice && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${props.notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
        >
          {props.notice.text}
        </div>
      )}

      {/* connection */}
      {conn ? (
        <div className={card}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${conn.status === "connected" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
              >
                {conn.status === "connected" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </span>
              <div>
                <p className="font-semibold text-stone-900">
                  {conn.label} {conn.status === "connected" ? "connected" : "needs reconnecting"}
                  {conn.environment === "sandbox" && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Test mode
                    </span>
                  )}
                </p>
                <p className="text-sm text-stone-500">
                  {conn.locationId ? "Location selected" : "No location selected yet"}
                  {conn.lastMenuSyncAt && ` · menu synced ${new Date(conn.lastMenuSyncAt).toLocaleString()}`}
                </p>
                {conn.lastError && <p className="mt-1 text-sm text-red-600">{conn.lastError}</p>}
              </div>
            </div>
            <Button
              variant="outline"
              disabled={pending}
              onClick={async () => {
                const yes = await confirm({
                  title: `Disconnect ${conn.label}?`,
                  description: "Website orders will stop going to your POS. You'll still get every order by email and Telegram.",
                  confirmText: "Disconnect",
                  destructive: true,
                });
                if (yes) run(() => disconnectPos(conn.provider), () => toast.success("Disconnected"));
              }}
            >
              Disconnect
            </Button>
          </div>

          {conn.provider === "square" && (
            <div className="mt-4 border-t border-stone-100 pt-4">
              {locations ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    defaultValue={conn.locationId ?? ""}
                    onChange={(e) => run(() => selectPosLocation(e.target.value), () => toast.success("Location saved"))}
                  >
                    <option value="" disabled>
                      Choose the location that cooks website orders
                    </option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Button variant="outline" size="sm" disabled={pending} onClick={() => run(listPosLocations, (r) => setLocations(r.locations))}>
                  <Store className="mr-1.5 h-4 w-4" /> {conn.locationId ? "Change location" : "Choose location"}
                </Button>
              )}
            </div>
          )}

          <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
            {(["pos_push", "pos_menu_sync"] as const).map((f) => (
              <label key={f} className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-medium text-stone-800">
                    {f === "pos_push" ? "Send paid website orders to the POS" : "Keep menu prices & sold-out items in sync"}
                  </span>
                  <span className="block text-xs text-stone-500">
                    {flags[f].killed
                      ? "Switched off by Starvega support (kill switch)."
                      : f === "pos_push"
                        ? "If the POS can't be reached we retry, then tell you to enter the order by hand. You always get the normal order alert."
                        : "Updates items already on your site. Never deletes anything."}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-stone-900"
                  checked={flags[f].on}
                  disabled={pending || flags[f].killed || conn.status !== "connected" || (f === "pos_push" && conn.provider === "square" && !conn.locationId)}
                  onChange={(e) => toggle(f, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className={card}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-semibold text-stone-900">Connect your POS</p>
            <select
              className="rounded-lg border border-stone-300 px-2 py-1 text-xs"
              value={env}
              onChange={(e) => setEnv(e.target.value as "sandbox" | "production")}
            >
              <option value="sandbox">Test (sandbox)</option>
              <option value="production">Live</option>
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {props.providers.map((p) => {
              const available = p.support !== "scaffold" && p.configured;
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{p.label}</p>
                    <p className="text-xs text-stone-500">
                      {p.support === "scaffold"
                        ? "Not available yet (needs partner access)"
                        : !p.configured
                          ? "Not set up on this site yet"
                          : p.support === "built_needs_approval" && env === "production"
                            ? "Live use needs Clover approval"
                            : "Ready"}
                    </p>
                  </div>
                  {available ? (
                    <Button asChild size="sm">
                      <a href={`/api/pos/${p.id}/connect?env=${env}`}>
                        <PlugZap className="mr-1.5 h-4 w-4" /> Connect
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-stone-500">Testing: paste a Square sandbox token</summary>
            <div className="mt-2 flex gap-2">
              <input
                className="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs"
                placeholder="EAAA… (Square developer dashboard → Sandbox → Access token)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <Button
                size="sm"
                disabled={pending || !token}
                onClick={() => run(() => connectSquareSandboxToken(token), () => (setToken(""), toast.success("Square sandbox connected")))}
              >
                Save
              </Button>
            </div>
          </details>
        </div>
      )}

      {/* mapping health + test order */}
      {conn?.status === "connected" && (
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-stone-900">Menu links</p>
              <p className="text-sm text-stone-500">
                {props.unmapped.length === 0
                  ? `Every item on your site is linked to ${conn.label}.`
                  : `${props.unmapped.length} item(s) on your site aren't linked to ${conn.label} yet (run "Check menu"): ${props.unmapped.slice(0, 6).join(", ")}${props.unmapped.length > 6 ? "…" : ""}`}
              </p>
            </div>
            {conn.environment === "sandbox" && (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => run(sendPosTestOrder, (r) => toast.success(`Test order sent (${r.posOrderId})`))}
              >
                Send a TEST order
              </Button>
            )}
          </div>
        </div>
      )}

      {/* menu import */}
      {conn?.status === "connected" && (
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-stone-900">Menu from {conn.label}</p>
              <p className="text-sm text-stone-500">See what would change before anything is saved.</p>
            </div>
            <Button variant="outline" disabled={pending} onClick={() => run(previewPosMenu, (r) => setPreview(r))}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Check menu
            </Button>
          </div>
          {preview && (
            <div className="mt-4 space-y-3 border-t border-stone-100 pt-4 text-sm">
              <p className="text-stone-700">
                {preview.counts.update} to update · {preview.counts.same} already match · {preview.counts.create} only in{" "}
                {conn.label} · {preview.counts.notInPos} only on your site (left alone)
              </p>
              {preview.rows.length > 0 && (
                <ul className="max-h-64 space-y-1 overflow-auto rounded-lg bg-stone-50 p-3">
                  {preview.rows.map((r, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="text-stone-800">{r.name}</span>
                      <span className="text-stone-500">{r.kind === "create" ? "new" : r.changes.join(", ")}</span>
                    </li>
                  ))}
                </ul>
              )}
              {preview.counts.create > 0 && (
                <label className="flex items-center gap-2 text-stone-700">
                  <input type="checkbox" checked={createNew} onChange={(e) => setCreateNew(e.target.checked)} />
                  Also add the {preview.counts.create} new item(s) to my site
                </label>
              )}
              <Button
                disabled={pending || (preview.counts.update === 0 && !(createNew && preview.counts.create))}
                onClick={() =>
                  run(
                    () => applyPosMenu(createNew),
                    (r) => {
                      toast.success(`Updated ${r.updated}, added ${r.created}`);
                      setPreview(null);
                    },
                  )
                }
              >
                Apply changes
              </Button>
            </div>
          )}
        </div>
      )}

      {/* order log */}
      {props.syncs.length > 0 && (
        <div className={card}>
          <p className="mb-3 font-semibold text-stone-900">Recent website orders → POS</p>
          <ul className="divide-y divide-stone-100 text-sm">
            {props.syncs.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <span className="font-mono text-xs text-stone-500">#{s.cartId.slice(0, 8)}</span>{" "}
                  <span className="text-stone-500">{new Date(s.createdAt).toLocaleString()}</span>
                  {s.lastError && <p className="truncate text-xs text-stone-500">{s.lastError}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status] ?? ""}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                  {(s.status === "manual" || s.status === "failed") && (
                    <>
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => retryPosOrder(s.id), (r) => toast(`Result: ${r.outcome}`))}>
                        Retry
                      </Button>
                      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => resolvePosOrder(s.id), () => toast.success("Marked as entered"))}>
                        I entered it
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
