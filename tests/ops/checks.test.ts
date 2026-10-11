import { describe, expect, it } from "vitest";
import { evaluateHealth, summarise, type HealthFacts } from "@/lib/ops/checks";

const healthy = (): HealthFacts => ({
  dbOk: true,
  platformTablesOk: true,
  adminSecret: true,
  stripeSource: "dashboard",
  smtp: true,
  ownerEmail: true,
  telegram: true,
  r2: true,
  delivery: { switchOn: false, uberConfigured: false, doordashActive: false },
  pos: null,
  staleNewOrders: 0,
  lastOrderAt: new Date("2026-10-10T12:00:00Z"),
  jobsSecret: true,
  now: new Date("2026-10-11T12:00:00Z"),
});

const byId = (f: HealthFacts) => Object.fromEntries(evaluateHealth(f).map((c) => [c.id, c]));

describe("evaluateHealth", () => {
  it("a healthy pickup-only site is all ok/off", () => {
    expect(summarise(evaluateHealth(healthy())).status).toBe("ok");
    expect(byId(healthy()).delivery.status).toBe("off");
  });

  it("no Stripe = fail (customers can't pay)", () => {
    const s = summarise(evaluateHealth({ ...healthy(), stripeSource: "none" }));
    expect(s.status).toBe("fail");
    expect(s.problems.map((p) => p.id)).toEqual(["payments"]);
  });

  it("delivery on with no courier = fail; DoorDash alone is fine", () => {
    expect(byId({ ...healthy(), delivery: { switchOn: true, uberConfigured: false, doordashActive: false } }).delivery.status).toBe("fail");
    expect(byId({ ...healthy(), delivery: { switchOn: true, uberConfigured: false, doordashActive: true } }).delivery.detail).toBe("DoorDash");
  });

  it("POS manual entries this week = warn, disconnected = fail", () => {
    const pos = { provider: "square", status: "connected", manualLast7d: 2, failedNow: 0, lastError: null };
    expect(byId({ ...healthy(), pos }).pos.status).toBe("warn");
    expect(byId({ ...healthy(), pos: { ...pos, status: "error", lastError: "token" } }).pos.status).toBe("fail");
  });

  it("missing migration and stuck kitchen orders are warnings", () => {
    const s = summarise(evaluateHealth({ ...healthy(), platformTablesOk: false, staleNewOrders: 3 }));
    expect(s.status).toBe("warn");
    expect(s.problems.map((p) => p.id).sort()).toEqual(["kitchen", "schema"]);
  });

  it("alerts: Telegram-only is a warning, nothing is a failure", () => {
    expect(byId({ ...healthy(), smtp: false }).alerts.status).toBe("warn");
    expect(byId({ ...healthy(), smtp: false, telegram: false }).alerts.status).toBe("fail");
  });
});

describe("evaluateHealth extras", () => {
  it("uptime, SMS provider, domain and recent failures", () => {
    const now = new Date("2026-10-11T12:00:00Z");
    const c = byId({
      ...healthy(),
      uptime: { ok: false, ms: 8000, status: 502 },
      smsProvider: false,
      siteUrl: "https://burnin-bird.vercel.app",
      lastFailures: [
        { kind: "stripe_webhook", at: new Date("2026-10-11T10:00:00Z"), detail: "boom" },
        { kind: "pos_manual", at: new Date("2026-10-01T10:00:00Z"), detail: "old" },
      ],
      now,
    });
    expect(c.uptime.status).toBe("fail");
    expect(c.sms.status).toBe("fail");
    expect(c.domain.status).toBe("warn");
    expect(c.recent_stripe_webhook.detail).toBe("2h ago: boom");
    expect(c.recent_pos_manual).toBeUndefined();
    expect(byId({ ...healthy(), siteUrl: "https://eatburnin.com" }).domain.status).toBe("ok");
  });
});
