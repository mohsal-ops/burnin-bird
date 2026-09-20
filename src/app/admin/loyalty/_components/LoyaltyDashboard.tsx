"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
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
import {
  Search,
  ArrowUpDown,
  Phone,
  Mail,
  Users,
  MessageSquare,
  Cake,
  QrCode,
  ShieldCheck,
  BellRing,
  UserCheck,
  UserX,
} from "lucide-react";
import { StatusPill, type PosTone } from "../../_components/pos";
import { sendBlast, sendEmailBlast, setLoyaltyEnabled, setLoyaltyPopupEnabled, saveBirthday } from "../_actions/loyaltyActions";
import type { LoyaltySettings } from "@/lib/loyalty";

// Kept as a plain string here (NOT imported from @/lib/loyalty) so this client
// component never pulls the server-only DB module into the browser bundle.
const OPT_OUT_LINE = "Reply STOP to unsubscribe.";

// Section + input tokens - the modern admin card treatment (matches Orders /
// Catering / Reviews). Status colours come from the shared POS palette (pos.tsx).
const CARD = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6";
const INPUT = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-300";
const SWITCH = "data-[state=unchecked]:bg-stone-300";

type Campaign = {
  id: string;
  channel?: string;
  message: string;
  type: string;
  recipientCount: number;
  redemptionCode?: string | null;
  discountPercent?: number;
  costCents?: number | null;
  redemptionCount?: number;
  sentAt: string;
};
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

// ── small building blocks ────────────────────────────────────────────────────
function SectionHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600">{icon}</span>
      <div className="min-w-0">
        <h2 className="font-semibold text-stone-800">{title}</h2>
        {desc && <p className="text-sm text-stone-500">{desc}</p>}
      </div>
    </div>
  );
}

function StatTile({ icon, n, label, accent }: { icon: React.ReactNode; n: number; label: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-2 grid size-9 place-items-center rounded-xl" style={{ background: accent + "18", color: accent }}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-stone-900">{n}</div>
      <div className="mt-0.5 text-xs font-medium text-stone-500">{label}</div>
    </div>
  );
}

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
  const total = subscribers.length;

  // Quiet-list notice (visible up top, not buried): flag when no send in 3+ weeks.
  const lastSentAt = campaigns.reduce<string | null>((max, c) => (!max || c.sentAt > max ? c.sentAt : max), null);
  const weeksSince = lastSentAt ? Math.floor((Date.now() - new Date(lastSentAt).getTime()) / (7 * 86_400_000)) : null;
  const listIsQuiet = lastSentAt === null || (weeksSince !== null && weeksSince >= 3);

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
    <div className="space-y-5 px-4 md:px-0">
      {/* Stat band */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={<Users size={18} />} n={total} label="Total contacts" accent="#c85a1e" />
        <StatTile icon={<MessageSquare size={18} />} n={smsSubscribed} label="SMS subscribers" accent="#1a6b3c" />
        <StatTile icon={<Mail size={18} />} n={emailSubscribed} label="Email subscribers" accent="#1d4ed8" />
        <StatTile icon={<UserX size={18} />} n={optedOut} label="Opted out" accent="#dc2626" />
      </div>

      {/* Quiet-list notice (prominent, not buried) */}
      {listIsQuiet && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <BellRing className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <span>
            {lastSentAt
              ? `No campaign sent in ${weeksSince} week${weeksSince === 1 ? "" : "s"}. Your list goes cold without regular offers - send one below to bring people back.`
              : "You haven't sent a campaign yet. Send your first text or email special below to start earning redemptions."}
          </span>
        </div>
      )}

      {/* Settings: master + popup toggles */}
      <div className={CARD}>
        <div className="flex items-start justify-between gap-4">
          <SectionHeader
            icon={<BellRing size={18} />}
            title="Loyalty & marketing"
            desc="Shows the opt-in at checkout and lets you text or email subscribers."
          />
          <Switch checked={enabled} onCheckedChange={toggleEnabled} aria-label="Loyalty enabled" className={`mt-1 ${SWITCH}`} />
        </div>
        <div className="mt-4 flex items-start justify-between gap-4 border-t border-stone-100 pt-4">
          <div className="min-w-0 pl-12">
            <h3 className="text-sm font-semibold text-stone-800">Show the rewards popup on the site</h3>
            <p className="text-sm text-stone-500">A one-time teaser inviting visitors to join (never on checkout or the rewards page).</p>
          </div>
          <Switch checked={popup} onCheckedChange={togglePopup} disabled={!enabled} aria-label="Show rewards popup" className={`mt-1 ${SWITCH}`} />
        </div>
      </div>

      {/* Growth */}
      <div className={CARD}>
        <SectionHeader icon={<UserCheck size={18} />} title="List growth" desc="New subscribers, last 14 days" />
        <div className="mt-5 flex h-24 items-end gap-1.5">
          {growth.map((g) => (
            <div key={g.label} className="flex flex-1 flex-col items-center justify-end" title={`${g.label}: ${g.count}`}>
              <div className="w-full rounded-t bg-[#c85a1e]/70" style={{ height: `${(g.count / maxGrowth) * 100}%`, minHeight: g.count ? 4 : 0 }} />
              <span className="mt-1 text-[9px] text-stone-400">{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribers */}
      <SubscriberList subscribers={subscribers} />

      <div className={enabled ? "space-y-5" : "pointer-events-none space-y-5 opacity-50"}>
        {/* Send SMS */}
        <div className={CARD}>
          <SectionHeader icon={<MessageSquare size={18} />} title="Send a text special" desc="Blast a one-off offer to everyone opted in to texts." />
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            maxLength={480}
            placeholder="e.g. Today only: free fries with any sandwich 🍟"
            className={`mt-4 ${INPUT}`}
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

        {/* Send Email */}
        <div className={CARD}>
          <SectionHeader icon={<Mail size={18} />} title="Send an email special" desc="Reach everyone opted in to email with a subject and message." />
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            maxLength={150}
            placeholder="Subject - e.g. This weekend only 🍗"
            className={`mt-4 ${INPUT}`}
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

        {/* QR */}
        <div className={CARD}>
          <SectionHeader icon={<QrCode size={18} />} title="Sign-up QR code" desc="Put it on table tents, receipts, or the counter - scanning opens your rewards join page." />
          <div className="mt-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Rewards sign-up QR code" width={128} height={128} className="rounded-xl border border-stone-200" />
            <div className="text-sm">
              <Button asChild variant="mainButton" size="sm">
                <a href={qrDataUrl} download="rewards-qr.png">Download PNG</a>
              </Button>
              <p className="mt-2 break-all text-xs text-stone-400">{rewardsUrl}</p>
            </div>
          </div>
        </div>

        {/* Birthday */}
        <div className={CARD}>
          <div className="flex items-start justify-between gap-4">
            <SectionHeader
              icon={<Cake size={18} />}
              title="Birthday offer (automatic)"
              desc={`Sent ${settings.birthdayDaysAhead} days before a subscriber's birthday. Off until you write and save a message.`}
            />
            <Switch checked={bEnabled} onCheckedChange={setBEnabled} aria-label="Turn on birthday automation" className={`mt-1 ${SWITCH}`} />
          </div>
          <textarea
            value={bMsg}
            onChange={(e) => setBMsg(e.target.value)}
            rows={2}
            maxLength={480}
            placeholder="Happy early birthday {firstName}! Here's a treat from us 🎂 …"
            className={`mt-4 ${INPUT}`}
          />
          <div className="mt-4 flex items-center gap-3">
            <Button variant="mainButton" size="md" disabled={pending} onClick={doSaveBirthday}>Save birthday settings</Button>
            {bResult && <span className="text-sm text-stone-500">{bResult}</span>}
          </div>
        </div>

        {/* Compliance */}
        <div className={CARD}>
          <SectionHeader icon={<ShieldCheck size={18} />} title="Compliance" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Opt-in wording currently shown on your ordering page</p>
          <p className="mt-1 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">{settings.consentText}</p>
          <p className="mt-3 text-sm text-stone-500">
            {smsSubscribed} SMS · {emailSubscribed} email · {optedOut} opted out. Every text includes “{OPT_OUT_LINE}” and only sends 8am–9:30pm; every email carries an unsubscribe link + your address.
          </p>
        </div>

        {/* Campaign performance + history */}
        {campaigns.length > 0 && <CampaignHistory campaigns={campaigns} />}
      </div>
    </div>
  );
}

// ── campaign performance + history ───────────────────────────────────────────
function fmtUsd(cents?: number | null): string {
  return cents == null ? "—" : `$${(cents / 100).toFixed(2)}`;
}
function redemptionRate(redemptions?: number, recipients?: number): number {
  if (!recipients) return 0;
  return Math.round(((redemptions ?? 0) / recipients) * 100);
}

type SortKey = "date" | "recipients" | "cost" | "redemptions" | "rate";

function ChannelSummary({
  label,
  tone,
  s,
}: {
  label: string;
  tone: PosTone;
  s: { sends: number; recipients: number; cost: number; redemptions: number; rate: number };
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-center justify-between">
        <StatusPill tone={tone} dot={false}>{label}</StatusPill>
        <span className="text-xs text-stone-400">{s.sends} send{s.sends === 1 ? "" : "s"}</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <div><div className="text-lg font-bold text-stone-800">{s.recipients}</div><div className="text-[10px] text-stone-500">sent</div></div>
        <div><div className="text-lg font-bold text-stone-800">{fmtUsd(s.cost)}</div><div className="text-[10px] text-stone-500">cost</div></div>
        <div><div className="text-lg font-bold text-stone-800">{s.redemptions}</div><div className="text-[10px] text-stone-500">redeemed</div></div>
        <div><div className="text-lg font-bold text-green-600">{s.rate}%</div><div className="text-[10px] text-stone-500">rate</div></div>
      </div>
    </div>
  );
}

function CampaignHistory({ campaigns }: { campaigns: Campaign[] }) {
  const [sort, setSort] = useState<SortKey>("date");
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(() => {
    const val = (c: Campaign) => {
      switch (sort) {
        case "recipients": return c.recipientCount;
        case "cost": return c.costCents ?? 0;
        case "redemptions": return c.redemptionCount ?? 0;
        case "rate": return redemptionRate(c.redemptionCount, c.recipientCount);
        default: return new Date(c.sentAt).getTime();
      }
    };
    return [...campaigns].sort((a, b) => (desc ? val(b) - val(a) : val(a) - val(b)));
  }, [campaigns, sort, desc]);

  // SMS and email kept as SEPARATE performance lines - never blended.
  const summary = (ch: "sms" | "email") => {
    const list = campaigns.filter((c) => (c.channel ?? "sms") === ch);
    const recipients = list.reduce((n, c) => n + c.recipientCount, 0);
    const redemptions = list.reduce((n, c) => n + (c.redemptionCount ?? 0), 0);
    return {
      sends: list.length,
      recipients,
      cost: list.reduce((n, c) => n + (c.costCents ?? 0), 0),
      redemptions,
      rate: redemptionRate(redemptions, recipients),
    };
  };

  const Th = ({ k, children, right }: { k: SortKey; children: ReactNode; right?: boolean }) => (
    <TableHead className={`text-stone-500 ${right ? "text-right" : ""}`}>
      <button
        onClick={() => (sort === k ? setDesc((d) => !d) : (setSort(k), setDesc(true)))}
        className={`inline-flex items-center gap-1 hover:text-stone-800 ${sort === k ? "text-stone-800" : ""}`}
      >
        {children}
        <ArrowUpDown className="size-3" />
      </button>
    </TableHead>
  );

  return (
    <div className={CARD}>
      <SectionHeader icon={<MessageSquare size={18} />} title="Campaign performance" desc="Every send, its cost, and how many orders redeemed its code." />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ChannelSummary label="SMS" tone="live" s={summary("sms")} />
        <ChannelSummary label="Email" tone="info" s={summary("email")} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-stone-200">
        <div className="max-h-[28rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-stone-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-stone-500">Message</TableHead>
                <TableHead className="text-stone-500">Channel</TableHead>
                <Th k="date">Sent</Th>
                <Th k="recipients" right>Recipients</Th>
                <Th k="cost" right>Cost</Th>
                <Th k="redemptions" right>Redeemed</Th>
                <Th k="rate" right>Rate</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c) => {
                const ch = (c.channel ?? "sms") === "email" ? "email" : "sms";
                const r = redemptionRate(c.redemptionCount, c.recipientCount);
                return (
                  <TableRow key={c.id} className="border-stone-100">
                    <TableCell className="max-w-[240px] truncate font-medium text-stone-800" title={c.message}>
                      {c.message}
                      {c.redemptionCode && (
                        <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-500">{c.redemptionCode}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={ch === "email" ? "info" : "live"} dot={false}>{ch === "email" ? "Email" : "SMS"}</StatusPill>
                    </TableCell>
                    <TableCell className="text-stone-500" suppressHydrationWarning>{new Date(c.sentAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right tabular-nums text-stone-700">{c.recipientCount}</TableCell>
                    <TableCell className="text-right tabular-nums text-stone-700">{fmtUsd(c.costCents)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-stone-800">{c.redemptionCount ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={r >= 10 ? "font-semibold text-green-600" : "text-stone-600"}>{r}%</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ── browsable subscriber list ────────────────────────────────────────────────
type Filter = "all" | "sms" | "email" | "opted";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sms", label: "SMS" },
  { key: "email", label: "Email" },
  { key: "opted", label: "Opted out" },
];

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
      newestFirst ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt),
    );
    return list;
  }, [subscribers, query, filter, newestFirst]);

  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-stone-400" />
          <h2 className="font-semibold text-stone-800">Subscribers</h2>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">{subscribers.length}</span>
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
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
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
                        {s.smsSubscribed && <StatusPill tone="live" dot={false}>SMS</StatusPill>}
                        {s.emailSubscribed && <StatusPill tone="info" dot={false}>Email</StatusPill>}
                        {s.optedOut && <StatusPill tone="off" dot={false}>Opted out</StatusPill>}
                        {!s.smsSubscribed && !s.emailSubscribed && !s.optedOut && <StatusPill tone="neutral" dot={false}>None</StatusPill>}
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
