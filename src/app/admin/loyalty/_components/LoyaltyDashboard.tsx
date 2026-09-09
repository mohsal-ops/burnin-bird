"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendBlast, sendEmailBlast, setLoyaltyEnabled, setLoyaltyPopupEnabled, saveBirthday } from "../_actions/loyaltyActions";
import type { LoyaltySettings } from "@/lib/loyalty";

// Kept as a plain string here (NOT imported from @/lib/loyalty) so this client
// component never pulls the server-only DB module into the browser bundle.
const OPT_OUT_LINE = "Reply STOP to unsubscribe.";

type Campaign = { id: string; channel?: string; message: string; type: string; recipientCount: number; sentAt: string };

export function LoyaltyDashboard({
  settings,
  smsSubscribed,
  emailSubscribed,
  optedOut,
  growth,
  campaigns,
  qrDataUrl,
  rewardsUrl,
}: {
  settings: LoyaltySettings;
  smsSubscribed: number;
  emailSubscribed: number;
  optedOut: number;
  growth: { label: string; count: number }[];
  campaigns: Campaign[];
  qrDataUrl: string;
  rewardsUrl: string;
}) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [popup, setPopup] = useState(settings.popupEnabled);
  const [msg, setMsg] = useState("");
  const [blastResult, setBlastResult] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailResult, setEmailResult] = useState("");
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
  const togglePopup = (v: boolean) => {
    setPopup(v);
    start(async () => { await setLoyaltyPopupEnabled(v); });
  };
  const doBlast = () =>
    start(async () => {
      const r = await sendBlast(msg);
      setBlastResult(r.error ? r.error : `Sent to ${r.sent} subscriber${r.sent === 1 ? "" : "s"}.`);
      if (!r.error) setMsg("");
    });
  const doEmailBlast = () =>
    start(async () => {
      const r = await sendEmailBlast(emailSubject, emailBody);
      setEmailResult(r.error ? r.error : `Emailed ${r.sent} subscriber${r.sent === 1 ? "" : "s"}.`);
      if (!r.error) {
        setEmailSubject("");
        setEmailBody("");
      }
    });
  const doSaveBirthday = () =>
    start(async () => {
      const r = await saveBirthday({ enabled: bEnabled, message: bMsg });
      setBEnabled(r.enabled);
      setBResult(r.enabled ? "Birthday automation on." : "Saved (off - add a message to enable).");
    });

  return (
    <div className="mt-4 space-y-6">
      {/* Enable */}
      <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <input type="checkbox" checked={enabled} onChange={(e) => toggleEnabled(e.target.checked)} className="h-5 w-5 accent-[#c85a1e]" />
        <span className="font-semibold text-stone-800">Loyalty texts enabled</span>
        <span className="text-sm text-stone-500">Shows the opt-in at checkout and lets you text subscribers.</span>
      </label>

      <div className={enabled ? "space-y-6" : "space-y-6 pointer-events-none opacity-50"}>
        {/* Site popup toggle */}
        <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
          <input type="checkbox" checked={popup} onChange={(e) => togglePopup(e.target.checked)} className="h-5 w-5 accent-[#c85a1e]" />
          <span className="font-semibold text-stone-800">Show the rewards popup on the site</span>
          <span className="text-sm text-stone-500">A one-time teaser that invites visitors to join (never on checkout or the rewards page).</span>
        </label>

        {/* Stats + growth */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex gap-6">
            <div><div className="text-3xl font-bold text-stone-800">{smsSubscribed}</div><div className="text-sm text-stone-500">📱 SMS subscribers</div></div>
            <div><div className="text-3xl font-bold text-stone-800">{emailSubscribed}</div><div className="text-sm text-stone-500">📧 Email subscribers</div></div>
            <div><div className="text-3xl font-bold text-stone-800">{optedOut}</div><div className="text-sm text-stone-500">Opted out</div></div>
          </div>
          <div className="mt-4 flex items-end gap-1 h-20">
            {growth.map((g) => (
              <div key={g.label} className="flex-1 flex flex-col items-center justify-end" title={`${g.label}: ${g.count}`}>
                <div className="w-full rounded-t bg-[#c85a1e]/70" style={{ height: `${(g.count / maxGrowth) * 100}%`, minHeight: g.count ? 4 : 0 }} />
                <span className="mt-1 text-[9px] text-stone-500">{g.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-stone-500">New subscribers, last 14 days</p>
        </div>

        {/* Send a special - SMS */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-800">📱 Send a text special</h2>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            maxLength={480}
            placeholder="e.g. Today only: free fries with any sandwich 🍟"
            className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 outline-none focus:border-[#c85a1e]"
          />
          <div className="mt-1 flex justify-between text-xs text-stone-500">
            <span>The opt-out line is added automatically.</span>
            <span>{msg.length}/480</span>
          </div>
          {preview && (
            <div className="mt-3 rounded-xl bg-stone-100 p-3 text-sm">
              <div className="text-xs font-semibold text-stone-500 mb-1">Preview</div>
              <div className="whitespace-pre-line">{preview}</div>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3">
            <Button variant="mainButton" size="md" disabled={pending || !msg.trim() || smsSubscribed === 0} onClick={doBlast}>
              {pending ? "Sending…" : `Send to ${smsSubscribed}`}
            </Button>
            {blastResult && <span className="text-sm text-stone-500">{blastResult}</span>}
          </div>
        </div>

        {/* Send a special - Email */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-800">📧 Send an email special</h2>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            maxLength={150}
            placeholder="Subject - e.g. This weekend only 🍗"
            className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 outline-none focus:border-[#c85a1e]"
          />
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={"Write your message. Use {firstName} to personalize.\n\nAn unsubscribe link and your address are added automatically."}
            className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 outline-none focus:border-[#c85a1e]"
          />
          <div className="mt-1 flex justify-between text-xs text-stone-500">
            <span>Unsubscribe link + your address are added automatically (required by law).</span>
            <span>{emailBody.length}/2000</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button variant="mainButton" size="md" disabled={pending || !emailSubject.trim() || !emailBody.trim() || emailSubscribed === 0} onClick={doEmailBlast}>
              {pending ? "Sending…" : `Email ${emailSubscribed}`}
            </Button>
            {emailResult && <span className="text-sm text-stone-500">{emailResult}</span>}
          </div>
        </div>

        {/* Sign-up QR code (for the physical restaurant) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-800">📷 Sign-up QR code</h2>
          <p className="mt-1 text-sm text-stone-500">
            Put this on table tents, receipts, or the counter - scanning it opens your rewards join page.
          </p>
          <div className="mt-3 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="Rewards sign-up QR code"
              width={128}
              height={128}
              className="rounded-lg border border-stone-200"
            />
            <div className="text-sm">
              <a
                href={qrDataUrl}
                download="southern-jerks-rewards-qr.png"
                className="inline-block rounded-lg bg-[#c85a1e] px-4 py-2 font-semibold text-white hover:bg-[#c85a1e]/90"
              >
                Download PNG
              </a>
              <p className="mt-2 break-all text-xs text-stone-400">{rewardsUrl}</p>
            </div>
          </div>
        </div>

        {/* Birthday automation */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-800">Birthday offer (automatic)</h2>
          <p className="mt-1 text-sm text-stone-500">
            Sent {settings.birthdayDaysAhead} days before a subscriber&apos;s birthday. Off until you write and save a message.
          </p>
          <textarea
            value={bMsg}
            onChange={(e) => setBMsg(e.target.value)}
            rows={2}
            maxLength={480}
            placeholder="Happy early birthday {firstName}! Here's a treat from us 🎂 …"
            className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-800 outline-none focus:border-[#c85a1e]"
          />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={bEnabled} onChange={(e) => setBEnabled(e.target.checked)} className="h-4 w-4 accent-[#c85a1e]" />
            Turn on birthday automation
          </label>
          <div className="mt-3 flex items-center gap-3">
            <Button variant="mainButton" size="md" disabled={pending} onClick={doSaveBirthday}>Save birthday settings</Button>
            {bResult && <span className="text-sm text-stone-500">{bResult}</span>}
          </div>
        </div>

        {/* Compliance */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold text-stone-800">Compliance</h2>
          <p className="mt-2 text-xs font-semibold text-stone-500">Opt-in wording currently shown on your ordering page:</p>
          <p className="mt-1 rounded-lg bg-stone-100 p-3 text-sm">{settings.consentText}</p>
          <p className="mt-3 text-sm text-stone-500">{smsSubscribed} SMS · {emailSubscribed} email · {optedOut} opted out. Every text includes “{OPT_OUT_LINE}” and only sends 8am–9:30pm; every email carries an unsubscribe link + your address.</p>
        </div>

        {/* Recent */}
        {campaigns.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold text-stone-800">Recent sends</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {campaigns.map((c) => (
                <li key={c.id} className="flex justify-between gap-3 border-b border-stone-200 pb-2 last:border-0">
                  <span className="truncate">{c.message}</span>
                  <span className="shrink-0 text-stone-500">
                    {c.channel === "email" ? "📧" : "📱"} {c.type === "birthday_auto" ? "🎂" : "📣"} {c.recipientCount} · {new Date(c.sentAt).toLocaleDateString()}
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
