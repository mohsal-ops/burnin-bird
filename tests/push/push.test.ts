import { beforeEach, describe, expect, it, vi } from "vitest";
import { courierMessage, ownerNewOrderMessage, readyMessage } from "@/lib/push/messages";

const st = vi.hoisted(() => ({
  flag: true,
  subs: [] as { id: string; endpoint: string; p256dh: string; auth: string; audience: string; cartId: string | null }[],
  deleted: [] as string[],
  settings: new Map<string, string>(),
  send: vi.fn(),
}));

vi.mock("web-push", () => ({
  default: {
    sendNotification: st.send,
    generateVAPIDKeys: () => ({ publicKey: "pub-test", privateKey: "priv-test" }),
  },
}));
vi.mock("@/lib/flags", () => ({ isEnabled: async () => st.flag }));
vi.mock("@/lib/siteConfig", () => ({ SITE_CONFIG: { name: "Test Grill" } }));
vi.mock("@/db/db", () => ({
  default: {
    siteSetting: {
      findUnique: async ({ where }: { where: { key: string } }) =>
        st.settings.has(where.key) ? { key: where.key, value: st.settings.get(where.key) } : null,
      create: async ({ data }: { data: { key: string; value: string } }) => {
        if (st.settings.has(data.key)) throw new Error("unique");
        st.settings.set(data.key, data.value);
      },
    },
    pushSubscription: {
      findMany: async ({ where }: { where: { audience: string; cartId?: string } }) =>
        st.subs.filter((s) => s.audience === where.audience && (where.cartId === undefined || s.cartId === where.cartId)),
      update: async () => ({}),
      delete: async ({ where }: { where: { id: string } }) => void st.deleted.push(where.id),
    },
  },
}));

import { getVapidKeys, pushToCustomer, pushToOwners } from "@/lib/push/send";

beforeEach(() => {
  st.flag = true;
  st.subs = [];
  st.deleted = [];
  st.settings.clear();
  st.send.mockReset();
  process.env.ADMIN_SECRET = "test-secret-not-real";
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
});

describe("push messages", () => {
  it("only buzzes for meaningful courier steps", () => {
    expect(courierMessage("pending", "R", "c")).toBeNull();
    expect(courierMessage("pickup", "R", "c")).toBeNull();
    expect(courierMessage("pickup_complete", "R", "c")?.title).toMatch(/On the way/);
    expect(courierMessage("delivered", "R", "c")?.tag).toBe("order-c");
  });
  it("ready message is for pickup orders only", () => {
    expect(readyMessage("delivery", "R", "c")).toBeNull();
    expect(readyMessage("pickup", "R", "c")?.body).toContain("R");
    expect(ownerNewOrderMessage(2350, "delivery")).toMatchObject({ title: "New order · $23.50", url: "/admin/orders" });
  });
});

describe("push sending", () => {
  it("is a no-op while the flag is off", async () => {
    st.flag = false;
    st.subs = [{ id: "1", endpoint: "https://push.test/1", p256dh: "k", auth: "a", audience: "owner", cartId: null }];
    expect(await pushToOwners(ownerNewOrderMessage(100, "pickup"))).toBe(0);
    expect(st.send).not.toHaveBeenCalled();
  });

  it("generates VAPID keys once, stores them encrypted, reuses them", async () => {
    const a = await getVapidKeys();
    expect(a.publicKey).toBe("pub-test");
    expect(st.settings.get("vapid_keys")).toMatch(/^v1:/);
    expect(st.settings.get("vapid_keys")).not.toContain("priv-test");
    expect(await getVapidKeys()).toEqual(a);
  });

  it("sends to owners and drops subscriptions the browser revoked (410)", async () => {
    st.subs = [
      { id: "ok", endpoint: "https://push.test/ok", p256dh: "k", auth: "a", audience: "owner", cartId: null },
      { id: "gone", endpoint: "https://push.test/gone", p256dh: "k", auth: "a", audience: "owner", cartId: null },
    ];
    st.send.mockImplementation(async (sub: { endpoint: string }) => {
      if (sub.endpoint.endsWith("gone")) throw Object.assign(new Error("gone"), { statusCode: 410 });
    });
    expect(await pushToOwners(ownerNewOrderMessage(100, "pickup"))).toBe(1);
    expect(st.deleted).toEqual(["gone"]);
    const [, payload, opts] = st.send.mock.calls[0];
    expect(JSON.parse(payload)).toMatchObject({ title: "New order · $1.00" });
    expect(opts.vapidDetails.publicKey).toBe("pub-test");
  });

  it("customer pushes only reach that order's subscribers, and null messages send nothing", async () => {
    st.subs = [
      { id: "mine", endpoint: "https://push.test/m", p256dh: "k", auth: "a", audience: "customer", cartId: "cart1" },
      { id: "other", endpoint: "https://push.test/o", p256dh: "k", auth: "a", audience: "customer", cartId: "cart2" },
    ];
    st.send.mockResolvedValue({});
    expect(await pushToCustomer("cart1", readyMessage("pickup", "R", "cart1"))).toBe(1);
    expect(st.send.mock.calls[0][0].endpoint).toBe("https://push.test/m");
    expect(await pushToCustomer("cart1", null)).toBe(0);
  });
});
