"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendBlast, setLoyaltyEnabled, saveBirthday } from "../_actions/loyaltyActions";
import { OPT_OUT_LINE } from "@/lib/loyalty";
import type { LoyaltySettings } from "@/lib/loyalty";

type Campaign = { id: string; message: string; type: string; recipientCount: number; sentAt: string };

export function LoyaltyDashboard({
  settings,
  subscribed,
  optedOut,
  growth,
  campaigns,
}: {
  settings: LoyaltySettings;
  subscribed: number;
  optedOut: number;
  growth: { label: string; count: number }[];
  campaigns: Campaign[];
}) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [msg, setMsg] = useState("");
  const [blastResult, setBlastResult] = useState("");
  const [bEnabled, setBEnabled] = useState(settings.birthdayEnabled);
  const [bMsg, setBMsg] = useState(settings.birthdayMessage);
  const [bResult, setBResult] = useState("");
  const [pending, start] = useTransition();

  const maxGrowth = Math.max(1, ...growth.map((g) => g.count));
  const preview = msg.trim() ? `${msg.trim()}\n${OPT_OUT_LINE}` : "";

  const toggleEnabled = (v: boolean) => {
    setEnabled(v);
    start(async () => { await setLoyaltyEnabled(v); });
  };
  const doBlast = () =>
    start(async () => {
      const r = await sendBlast(msg);
      setBlastResult(r.error ? r.error : `Sent to ${r.sent} subscriber${r.sent === 1 ? "" : "s"}.`);
      if (!r.error) setMsg("");
    });
  const doSaveBirthday = () =>
    start(async () => {
      const r = await saveBirthday({ enabled: bEnabled, message: bMsg });
      setBEnabled(r.enabled);
      setBResult(r.enabled ? "Birthday automation on." : "Saved (off — add a message to enable).");
    });

  return (
    <div className="mt-4 space-y-6">
      {/* Enable */}
      <label className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <input type="checkbox" checked={enabled} onChange={(e) => toggleEnabled(e.target.checked)} className="h-5 w-5 accent-primary" />
        <span className="font-semibold text-foreground">Loyalty texts enabled</span>
        <span className="text-sm text-muted-foreground">Shows the opt-in at checkout and lets you text subscribers.</span>
      </label>

      <div className={enabled ? "space-y-6" : "space-y-6 pointer-events-none opacity-50"}>
        {/* Stats + growth */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex gap-6">
            <div><div className="text-3xl font-bold text-foreground">{subscribed}</div><div className="text-sm text-muted-foreground">Subscribed</div></div>
            <div><div className="text-3xl font-bold text-foreground">{optedOut}</div><div className="text-sm text-muted-foreground">Opted out</div></div>
          </div>
          <div className="mt-4 flex items-end gap-1 h-20">
            {growth.map((g) => (
              <div key={g.label} className="flex-1 flex flex-col items-center justify-end" title={`${g.label}: ${g.count}`}>
                <div className="w-full rounded-t bg-primary/70" style={{ height: `${(g.count / maxGrowth) * 100}%`, minHeight: g.count ? 4 : 0 }} />
                <span className="mt-1 text-[9px] text-muted-foreground">{g.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">New subscribers, last 14 days</p>
        </div>

        {/* Send a special */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Send a special</h2>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            maxLength={480}
            placeholder="e.g. Today only: free fries with any sandwich 🍟"
            className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>The opt-out line is added automatically.</span>
            <span>{msg.length}/480</span>
          </div>
          {preview && (
            <div className="mt-3 rounded-xl bg-muted p-3 text-sm">
              <div className="text-xs font-semibold text-muted-foreground mb-1">Preview</div>
              <div className="whitespace-pre-line">{preview}</div>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3">
            <Button variant="mainButton" disabled={pending || !msg.trim() || subscribed === 0} onClick={doBlast}>
              {pending ? "Sending…" : `Send to ${subscribed}`}
            </Button>
            {blastResult && <span className="text-sm text-muted-foreground">{blastResult}</span>}
          </div>
        </div>

        {/* Birthday automation */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Birthday offer (automatic)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sent {settings.birthdayDaysAhead} days before a subscriber&apos;s birthday. Off until you write and save a message.
          </p>
          <textarea
            value={bMsg}
            onChange={(e) => setBMsg(e.target.value)}
            rows={2}
            maxLength={480}
            placeholder="Happy early birthday {firstName}! Here's a treat from us 🎂 …"
            className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
          />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={bEnabled} onChange={(e) => setBEnabled(e.target.checked)} className="h-4 w-4 accent-primary" />
            Turn on birthday automation
          </label>
          <div className="mt-3 flex items-center gap-3">
            <Button variant="outline" disabled={pending} onClick={doSaveBirthday}>Save birthday settings</Button>
            {bResult && <span className="text-sm text-muted-foreground">{bResult}</span>}
          </div>
        </div>

        {/* Compliance */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Compliance</h2>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">Opt-in wording currently shown on your ordering page:</p>
          <p className="mt-1 rounded-lg bg-muted p-3 text-sm">{settings.consentText}</p>
          <p className="mt-3 text-sm text-muted-foreground">{subscribed} subscribed · {optedOut} opted out. Every marketing text includes “{OPT_OUT_LINE}” and only sends 8am–9:30pm.</p>
        </div>

        {/* Recent */}
        {campaigns.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground">Recent sends</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {campaigns.map((c) => (
                <li key={c.id} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                  <span className="truncate">{c.message}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {c.type === "birthday_auto" ? "🎂" : "📣"} {c.recipientCount} · {new Date(c.sentAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
