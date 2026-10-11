// Pure: turn raw facts about a site into health checks. The server gathers the
// facts (health.ts); this decides ok / warn / fail so it can be unit tested.

export type CheckStatus = "ok" | "warn" | "fail" | "off";

export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface HealthFacts {
  dbOk: boolean;
  /** New platform tables present (client DB migrated). */
  platformTablesOk: boolean;
  adminSecret: boolean;
  stripeSource: "dashboard" | "env" | "none";
  smtp: boolean;
  ownerEmail: boolean;
  telegram: boolean;
  r2: boolean;
  delivery: { switchOn: boolean; uberConfigured: boolean; doordashActive: boolean };
  pos: null | { provider: string; status: string; manualLast7d: number; failedNow: number; lastError: string | null };
  /** Paid orders still "new" (kitchen never marked done) older than 6h. */
  staleNewOrders: number;
  lastOrderAt: Date | null;
  jobsSecret: boolean;
  now: Date;
  /** Homepage answered (null = not checked here). */
  uptime?: { ok: boolean; ms: number; status?: number } | null;
  /** Loyalty SMS on -> is the SMS provider configured? null = loyalty off. */
  smsProvider?: boolean | null;
  siteUrl?: string;
  lastFailures?: { kind: string; at: Date; detail: string }[];
}

export function evaluateHealth(f: HealthFacts): Check[] {
  const c: Check[] = [];
  const add = (id: string, label: string, status: CheckStatus, detail: string) => c.push({ id, label, status, detail });

  if (f.uptime)
    add(
      "uptime",
      "Website responds",
      f.uptime.ok ? (f.uptime.ms > 4000 ? "warn" : "ok") : "fail",
      f.uptime.ok ? `Homepage answered in ${f.uptime.ms} ms` : `Homepage did not answer${f.uptime.status ? ` (HTTP ${f.uptime.status})` : ""}`,
    );
  add("db", "Database", f.dbOk ? "ok" : "fail", f.dbOk ? "Reachable" : "Can't reach the database");
  add(
    "schema",
    "Database up to date",
    f.platformTablesOk ? "ok" : "warn",
    f.platformTablesOk ? "All tables present" : "New tables missing — run migrate-client-dbs before turning features on",
  );
  add("secret", "Admin secret", f.adminSecret ? "ok" : "fail", f.adminSecret ? "Set" : "ADMIN_SECRET missing — logins and stored keys break");
  add(
    "payments",
    "Card payments",
    f.stripeSource === "none" ? "fail" : "ok",
    f.stripeSource === "none" ? "Stripe not connected — customers can't pay online" : `Stripe connected (${f.stripeSource})`,
  );
  add(
    "alerts",
    "Order alerts",
    f.smtp && f.ownerEmail ? "ok" : f.telegram ? "warn" : "fail",
    [f.smtp && f.ownerEmail ? "email" : "no email", f.telegram ? "Telegram" : "no Telegram"].join(" · "),
  );
  if (f.smsProvider !== undefined && f.smsProvider !== null)
    add("sms", "SMS provider", f.smsProvider ? "ok" : "fail", f.smsProvider ? "Brevo configured" : "Loyalty SMS is on but BREVO_API_KEY is missing");
  if (f.siteUrl) {
    const host = new URL(f.siteUrl).hostname;
    const vercel = /\.vercel\.app$/i.test(host);
    add(
      "domain",
      "Domain & certificate",
      vercel ? "warn" : "ok",
      vercel ? "Still on the free vercel.app address (no custom domain yet)" : `${host}: HTTPS certificate auto-renewed by Vercel`,
    );
  }
  for (const lf of f.lastFailures ?? []) {
    const hours = (f.now.getTime() - lf.at.getTime()) / 3600_000;
    if (hours <= 24)
      add(`recent_${lf.kind}`, `Recent ${lf.kind.replace(/_/g, " ")} failure`, "warn", `${Math.round(hours)}h ago: ${lf.detail}`);
  }
  add("uploads", "Photo uploads", f.r2 ? "ok" : "warn", f.r2 ? "R2 storage set" : "R2 not set — uploads use the fallback path");

  if (!f.delivery.switchOn) add("delivery", "Delivery", "off", "Pickup only");
  else if (!f.delivery.uberConfigured && !f.delivery.doordashActive) add("delivery", "Delivery", "fail", "Delivery is on but no courier is set up");
  else
    add(
      "delivery",
      "Delivery",
      "ok",
      [f.delivery.uberConfigured && "Uber", f.delivery.doordashActive && "DoorDash"].filter(Boolean).join(" + "),
    );

  if (!f.pos) add("pos", "POS", "off", "No POS connected");
  else if (f.pos.status !== "connected") add("pos", "POS", "fail", `${f.pos.provider}: needs reconnecting${f.pos.lastError ? ` (${f.pos.lastError})` : ""}`);
  else if (f.pos.manualLast7d > 0 || f.pos.failedNow > 0)
    add("pos", "POS", "warn", `${f.pos.provider}: ${f.pos.manualLast7d} order(s) needed manual entry this week, ${f.pos.failedNow} retrying`);
  else add("pos", "POS", "ok", `${f.pos.provider} connected`);

  add(
    "kitchen",
    "Open orders",
    f.staleNewOrders > 0 ? "warn" : "ok",
    f.staleNewOrders > 0 ? `${f.staleNewOrders} paid order(s) not marked done after 6h` : "Nothing stuck",
  );

  const days = f.lastOrderAt ? Math.floor((f.now.getTime() - f.lastOrderAt.getTime()) / 86400_000) : null;
  add(
    "activity",
    "Last online order",
    days === null ? "off" : days > 14 ? "warn" : "ok",
    days === null ? "No online orders yet" : days === 0 ? "Today" : `${days} day(s) ago`,
  );

  add("jobs", "Scheduled jobs", f.jobsSecret ? "ok" : "off", f.jobsSecret ? "Retry/report endpoints enabled" : "STARVEGA_JOBS_SECRET not set (no auto-retries)");
  return c;
}

export function summarise(checks: Check[]): { status: CheckStatus; problems: Check[] } {
  const problems = checks.filter((x) => x.status === "fail" || x.status === "warn");
  return { status: checks.some((x) => x.status === "fail") ? "fail" : problems.length ? "warn" : "ok", problems };
}
