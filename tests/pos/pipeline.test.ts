import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-ins for the DB + side effects. No network, no real sends.
const state = vi.hoisted(() => ({
  flagOn: true,
  conn: null as null | Record<string, unknown>,
  syncs: new Map<string, Record<string, unknown>>(),
  push: vi.fn(),
  telegram: vi.fn(async () => {}),
  mail: vi.fn(async () => {}),
}));

vi.mock("@/lib/flags", () => ({ isEnabled: async () => state.flagOn }));
vi.mock("@/lib/ops/alert", () => ({ opsAlert: async () => {} }));
vi.mock("@/lib/telegram", () => ({ sendTelegramMessage: state.telegram }));
vi.mock("@/lib/email", () => ({ sendMail: state.mail }));
vi.mock("@/lib/siteConfig", () => ({ SITE_CONFIG: { name: "Test Grill", timezone: "America/New_York" } }));
vi.mock("@/lib/pos/connection", () => ({
  getActiveConnection: async () => state.conn,
  loadContext: async () => ({ environment: "sandbox", locationId: "L", creds: { accessToken: "t" } }),
}));
vi.mock("@/lib/pos/registry", async () => ({
  getAdapter: () => ({ support: "built", pushOrder: state.push }),
  POS_LABELS: { square: "Square", clover: "Clover" },
}));
vi.mock("@/db/db", () => {
  let n = 0;
  const posOrderSync = {
    upsert: async ({ where, create }: { where: { cartId_provider: { cartId: string } }; create: Record<string, unknown> }) => {
      const found = [...state.syncs.values()].find((s) => s.cartId === where.cartId_provider.cartId);
      if (found) return found;
      const row = { id: `s${++n}`, attempts: 0, posOrderId: null, ...create };
      state.syncs.set(row.id as string, row);
      return row;
    },
    findUnique: async ({ where }: { where: { id: string } }) => state.syncs.get(where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = { ...state.syncs.get(where.id), ...data };
      state.syncs.set(where.id, row);
      return row;
    },
    findMany: async () =>
      [...state.syncs.values()].filter((s) => s.status === "failed" && (s.nextRetryAt as Date) <= new Date()),
  };
  return {
    default: {
      posOrderSync,
      posConnection: { findUnique: async () => state.conn },
      cart: {
        findUnique: async () => ({
          id: "cart1",
          uberFeeCents: null,
          promoCampaignId: null,
          items: [
            {
              name: "Burger", price: 1000, quantity: 1, orderType: "pickup", pickupDay: null, pickupTime: null,
              deliveryAddress: null, apt: null, instructions: null, customerName: "T", customerPhone: null, sides: [],
            },
          ],
        }),
      },
      loyaltyCampaign: { findUnique: async () => null },
    },
  };
});

import { pushOrderToPos, retryDuePosOrders, MAX_ATTEMPTS } from "@/lib/pos/pipeline";
import { PosError } from "@/lib/pos/types";

beforeEach(() => {
  state.flagOn = true;
  state.conn = { id: "c", provider: "square", status: "connected", environment: "sandbox", merchantId: null, locationId: "L", credsEnc: "x" };
  state.syncs.clear();
  state.push.mockReset();
  state.telegram.mockClear();
  state.mail.mockClear();
  process.env.STARVEGA_JOBS_SECRET = "jobs-secret";
  process.env.OWNER_ALERT_EMAIL = "owner@example.test";
});

describe("POS pipeline", () => {
  it("does nothing when the flag is off or no POS is connected", async () => {
    state.flagOn = false;
    expect(await pushOrderToPos("cart1", "a@example.test")).toBe("skipped");
    state.flagOn = true;
    state.conn = null;
    expect(await pushOrderToPos("cart1", "a@example.test")).toBe("skipped");
    expect(state.push).not.toHaveBeenCalled();
  });

  it("sends once, and a second call for the same cart is a no-op", async () => {
    state.push.mockResolvedValue({ posOrderId: "SQ1", posTotalCents: 1000 });
    expect(await pushOrderToPos("cart1", "a@example.test")).toBe("sent");
    expect(await pushOrderToPos("cart1", "a@example.test")).toBe("sent");
    expect(state.push).toHaveBeenCalledTimes(1);
    const row = [...state.syncs.values()][0];
    expect(row).toMatchObject({ status: "sent", posOrderId: "SQ1", lastError: null });
  });

  it("records a total mismatch instead of hiding it", async () => {
    state.push.mockResolvedValue({ posOrderId: "SQ1", posTotalCents: 1089 });
    await pushOrderToPos("cart1", "");
    expect([...state.syncs.values()][0].lastError).toContain("POS total 1089");
  });

  it("schedules a retry on a retryable error, then sends on retry", async () => {
    state.push.mockRejectedValueOnce(new PosError("HTTP 503", true, 503));
    expect(await pushOrderToPos("cart1", "")).toBe("retrying");
    const row = [...state.syncs.values()][0];
    expect(row.status).toBe("failed");
    expect((row.nextRetryAt as Date).getTime()).toBeGreaterThan(Date.now());
    row.nextRetryAt = new Date(Date.now() - 1000);
    state.push.mockResolvedValueOnce({ posOrderId: "SQ1" });
    expect(await retryDuePosOrders()).toEqual({ tried: 1, sent: 1 });
    expect(state.telegram).not.toHaveBeenCalled();
  });

  it("gives up to manual + alerts the owner on a non-retryable error", async () => {
    state.push.mockRejectedValue(new PosError("HTTP 400: INVALID_VALUE", false, 400));
    expect(await pushOrderToPos("cart1", "")).toBe("manual");
    expect(state.telegram).toHaveBeenCalledOnce();
    expect(state.mail).toHaveBeenCalledOnce();
  });

  it("gives up after MAX_ATTEMPTS retryable failures", async () => {
    state.push.mockRejectedValue(new PosError("HTTP 503", true, 503));
    await pushOrderToPos("cart1", "");
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      [...state.syncs.values()][0].nextRetryAt = new Date(Date.now() - 1000);
      await retryDuePosOrders();
    }
    expect([...state.syncs.values()][0]).toMatchObject({ status: "manual", attempts: MAX_ATTEMPTS });
    expect(state.telegram).toHaveBeenCalledOnce();
  });

  it("without a scheduler configured, a failure goes straight to manual (nothing would retry it)", async () => {
    delete process.env.STARVEGA_JOBS_SECRET;
    state.push.mockRejectedValue(new PosError("HTTP 503", true, 503));
    expect(await pushOrderToPos("cart1", "")).toBe("manual");
  });
});
