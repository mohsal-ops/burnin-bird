"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowUpDown, Phone, Mail, Users } from "lucide-react";
import { sendBlast, sendEmailBlast, setLoyaltyEnabled, setLoyaltyPopupEnabled, saveBirthday } from "../_actions/loyaltyActions";
import type { LoyaltySettings } from "@/lib/loyalty";

// Kept as a plain string here (NOT imported from @/lib/loyalty) so this client
// component never pulls the server-only DB module into the browser bundle.
const OPT_OUT_LINE = "Reply STOP to unsubscribe.";

// Shared styling so this page matches the branding/catering admin sections
// exactly (same card, input, and toggle treatment).
const CARD = "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm";
const INPUT = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-300";
// Enabled toggles read as "live" (green) everywhere - see the shared Switch
// default; here we only tweak the off state for a touch more contrast.
const SWITCH = "data-[state=unchecked]:bg-stone-300";

type Campaign = { id: string; channel?: string; message: string; type: string; recipientCount: number; sentAt: string };
type Subscriber = {
  id: string;
  firstName: string | null;
  phone: string | null;
  email: string | null;
  smsSubscribed: boolean;
  emailSubscribed: boolean;
  optedOut: boolean;
  createdAt: string;
};

export function LoyaltyDashboard({
  settings,
  smsSubscribed,
  emailSubscribed,
  optedOut,
  growth,
  subscribers,
  campaigns,
  qrDataUrl,
  rewardsUrl,
}: {
  settings: LoyaltySettings;
  smsSubscribed: number;
  emailSubscribed: number;
  optedOut: number;
  growth: { label: string; count: number }[];
  subscribers: Subscriber[];
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
    <div className="space-y-6 px-4 md:px-0">
      {/* Enable */}
      <div className={`${CARD} flex items-start justify-between gap-4`}>
        <div>
          <h2 className="font-semibold text-stone-800">Loyalty texts enabled</h2>
          <p className="text-sm text-stone-500">Shows the opt-in at checkout and lets you text subscribers.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={toggleEnabled} aria-label="Loyalty texts enabled" className={`mt-1 ${SWITCH}`} />
      </div>

      {/* Stats + growth (always visible so you can see the list any time) */}
      <div className={CARD}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { n: smsSubscribed, label: "SMS subscribers", icon: "📱" },
            { n: emailSubscribed, label: "Email subscribers", icon: "📧" },
            { n: optedOut, label: "Opted out", icon: "🚫" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="text-3xl font-bold text-stone-800">{s.n}</div>
              <div className="mt-0.5 text-sm text-stone-500">{s.icon} {s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex h-20 items-end gap-1">
          {growth.map((g) => (
            <div key={g.label} className="flex flex-1 flex-col items-center justify-end" title={`${g.label}: ${g.count}`}>
              <div className="w-full rounded-t bg-[#c85a1e]/70" style={{ height: `${(g.count / maxGrowth) * 100}%`, minHeight: g.count ? 4 : 0 }} />
              <span className="mt-1 text-[9px] text-stone-500">{g.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-stone-500">New subscribers, last 14 days</p>
      </div>

      {/* Subscriber list (Phase 1) - always visible */}
      <SubscriberList subscribers={subscribers} />

      <div className={enabled ? "space-y-6" : "space-y-6 pointer-events-none opacity-50"}>
        {/* Site popup toggle */}
        <div className={`${CARD} flex items-start justify-between gap-4`}>
          <div>
            <h2 className="font-semibold text-stone-800">Show the rewards popup on the site</h2>
            <p className="text-sm text-stone-500">A one-time teaser that invites visitors to join (never on checkout or the rewards page).</p>
          </div>
          <Switch checked={popup} onCheckedChange={togglePopup} aria-label="Show rewards popup" className={`mt-1 ${SWITCH}`} />
        </div>

        {/* Send a special - SMS */}
        <div className={CARD}>
          <h2 className="font-semibold text-stone-800">📱 Send a text special</h2>
          <p className="text-sm text-stone-500">Blast a one-off offer to everyone opted in to texts.</p>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            maxLength={480}
            placeholder="e.g. Today only: free fries with any sandwich 🍟"
            className={`mt-3 ${INPUT}`}
          />
          <div className="mt-1 flex justify-between text-xs text-stone-500">
            <span>The opt-out line is added automatically.</span>
            <span>{msg.length}/480</span>
          </div>
          {preview && (
            <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Preview</div>
              <div className="whitespace-pre-line text-stone-700">{preview}</div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <Button variant="mainButton" size="md" disabled={pending || !msg.trim() || smsSubscribed === 0} onClick={doBlast}>
              {pending ? "Sending…" : `Send to ${smsSubscribed}`}
            </Button>
            {blastResult && <span className="text-sm text-stone-500">{blastResult}</span>}
          </div>
        </div>

        {/* Send a special - Email */}
        <div className={CARD}>
          <h2 className="font-semibold text-stone-800">📧 Send an email special</h2>
          <p className="text-sm text-stone-500">Reach everyone opted in to email with a subject and message.</p>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            maxLength={150}
            placeholder="Subject - e.g. This weekend only 🍗"
            className={`mt-3 ${INPUT}`}
          />
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={"Write your message. Use {firstName} to personalize.\n\nAn unsubscribe link and your address are added automatically."}
            className={`mt-2 ${INPUT}`}
          />
          <div className="mt-1 flex justify-between text-xs text-stone-500">
            <span>Unsubscribe link + your address are added automatically (required by law).</span>
            <span>{emailBody.length}/2000</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="mainButton" size="md" disabled={pending || !emailSubject.trim() || !emailBody.trim() || emailSubscribed === 0} onClick={doEmailBlast}>
              {pending ? "Sending…" : `Email ${emailSubscribed}`}
            </Button>
            {emailResult && <span className="text-sm text-stone-500">{emailResult}</span>}
          </div>
        </div>

        {/* Sign-up QR code (for the physical restaurant) */}
        <div className={CARD}>
          <h2 className="font-semibold text-stone-800">📷 Sign-up QR code</h2>
          <p className="mt-1 text-sm text-stone-500">
            Put this on table tents, receipts, or the counter - scanning it opens your rewards join page.
          </p>
          <div className="mt-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="Rewards sign-up QR code"
              width={128}
              height={128}
              className="rounded-xl border border-stone-200"
            />
            <div className="text-sm">
              <Button asChild variant="mainButton" size="sm">
                <a href={qrDataUrl} download="rewards-qr.png">Download PNG</a>
              </Button>
              <p className="mt-2 break-all text-xs text-stone-400">{rewardsUrl}</p>
            </div>
          </div>
        </div>

        {/* Birthday automation */}
        <div className={CARD}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-stone-800">Birthday offer (automatic)</h2>
              <p className="mt-1 text-sm text-stone-500">
                Sent {settings.birthdayDaysAhead} days before a subscriber&apos;s birthday. Off until you write and save a message.
              </p>
            </div>
            <Switch checked={bEnabled} onCheckedChange={setBEnabled} aria-label="Turn on birthday automation" className={`mt-1 ${SWITCH}`} />
          </div>
          <textarea
            value={bMsg}
            onChange={(e) => setBMsg(e.target.value)}
            rows={2}
            maxLength={480}
            placeholder="Happy early birthday {firstName}! Here's a treat from us 🎂 …"
            className={`mt-3 ${INPUT}`}
          />
          <div className="mt-4 flex items-center gap-3">
            <Button variant="mainButton" size="md" disabled={pending} onClick={doSaveBirthday}>Save birthday settings</Button>
            {bResult && <span className="text-sm text-stone-500">{bResult}</span>}
          </div>
        </div>

        {/* Compliance */}
        <div className={CARD}>
          <h2 className="font-semibold text-stone-800">Compliance</h2>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Opt-in wording currently shown on your ordering page</p>
          <p className="mt-1 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">{settings.consentText}</p>
          <p className="mt-3 text-sm text-stone-500">{smsSubscribed} SMS · {emailSubscribed} email · {optedOut} opted out. Every text includes “{OPT_OUT_LINE}” and only sends 8am–9:30pm; every email carries an unsubscribe link + your address.</p>
        </div>

        {/* Recent */}
        {campaigns.length > 0 && (
          <div className={CARD}>
            <h2 className="font-semibold text-stone-800">Recent sends</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {campaigns.map((c) => (
                <li key={c.id} className="flex justify-between gap-3 border-b border-stone-100 pb-2 last:border-0">
                  <span className="truncate text-stone-700">{c.message}</span>
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

// ── Phase 1: browsable subscriber list ───────────────────────────────────────
type Filter = "all" | "sms" | "email" | "opted";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sms", label: "SMS" },
  { key: "email", label: "Email" },
  { key: "opted", label: "Opted out" },
];

function Badge({ tone, children }: { tone: "green" | "blue" | "red" | "stone"; children: React.ReactNode }) {
  // Canonical POS status palette (admin/_components/pos.tsx).
  const tones = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    stone: "bg-stone-100 text-stone-600",
  } as const;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
  );
}

function SubscriberList({ subscribers }: { subscribers: Subscriber[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [newestFirst, setNewestFirst] = useState(true);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = subscribers.filter((s) => {
      if (filter === "sms" && !s.smsSubscribed) return false;
      if (filter === "email" && !s.emailSubscribed) return false;
      if (filter === "opted" && !s.optedOut) return false;
      if (!q) return true;
      return (
        (s.firstName ?? "").toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) =>
      newestFirst
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
    return list;
  }, [subscribers, query, filter, newestFirst]);

  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-stone-400" />
          <h2 className="font-semibold text-stone-800">Subscribers</h2>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">
            {subscribers.length}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email…"
            className={`${INPUT} w-[240px] max-w-full pl-8`}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f.key ? "bg-brand text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setNewestFirst((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-200"
          title="Toggle sort by date joined"
        >
          <ArrowUpDown className="size-3.5" />
          {newestFirst ? "Newest first" : "Oldest first"}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-stone-200">
        <div className="max-h-[28rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-stone-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-stone-500">Name</TableHead>
                <TableHead className="text-stone-500">Contact</TableHead>
                <TableHead className="text-stone-500">Status</TableHead>
                <TableHead className="text-right text-stone-500">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-stone-400">
                    {subscribers.length === 0 ? "No subscribers yet." : "No subscribers match."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((s) => (
                  <TableRow key={s.id} className="border-stone-100">
                    <TableCell className="font-medium text-stone-800">
                      {s.firstName?.trim() || <span className="text-stone-400">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-sm text-stone-600">
                        {s.phone && (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="size-3 text-stone-400" /> {s.phone}
                          </span>
                        )}
                        {s.email && (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="size-3 text-stone-400" /> {s.email}
                          </span>
                        )}
                        {!s.phone && !s.email && <span className="text-stone-400">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {s.smsSubscribed && <Badge tone="green">SMS</Badge>}
                        {s.emailSubscribed && <Badge tone="blue">Email</Badge>}
                        {s.optedOut && <Badge tone="red">Opted out</Badge>}
                        {!s.smsSubscribed && !s.emailSubscribed && !s.optedOut && <Badge tone="stone">None</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-stone-500" suppressHydrationWarning>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {rows.length > 0 && (
        <p className="mt-2 text-xs text-stone-400">
          Showing {rows.length} of {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}
