import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { cartIdFromExternal, createDoorDashProvider, doordashJwt, mapDoorDashStatus } from "@/lib/delivery/doordash";
import { mockFetch } from "../pos/helpers";

// Fake creds: the signing secret is base64url, as DoorDash issues it.
const creds = { developerId: "dev-123", keyId: "key-456", signingSecret: Buffer.from("not-a-real-secret").toString("base64url") };
afterEach(() => vi.unstubAllGlobals());

const dropoff = { formatted: "2 Test Ave", name: "T", phone: "+15550000001" };
const pickup = { formatted: "1 Test St", businessName: "Test Grill", phone: "+15550000000" };

describe("DoorDash JWT", () => {
  it("has the dd-ver header, the right claims, and verifies with the decoded secret", () => {
    const jwt = doordashJwt(creds, 1_700_000_000);
    const [h, p, s] = jwt.split(".");
    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({ alg: "HS256", typ: "JWT", "dd-ver": "DD-JWT-V1" });
    expect(JSON.parse(Buffer.from(p, "base64url").toString())).toEqual({
      aud: "doordash", iss: "dev-123", kid: "key-456", iat: 1_700_000_000, exp: 1_700_000_300,
    });
    const expect64 = createHmac("sha256", Buffer.from("not-a-real-secret")).update(`${h}.${p}`).digest("base64url");
    expect(s).toBe(expect64);
  });
});

describe("DoorDash statuses", () => {
  it("maps to the app's courier vocabulary", () => {
    expect(mapDoorDashStatus("picked_up")).toBe("pickup_complete");
    expect(mapDoorDashStatus("delivered")).toBe("delivered");
    expect(mapDoorDashStatus("cancelled")).toBe("canceled");
    expect(mapDoorDashStatus(undefined)).toBe("pending");
    expect(cartIdFromExternal("1b2c-uuid.rk3j2")).toBe("1b2c-uuid");
    expect(cartIdFromExternal("1b2c-uuid")).toBe("1b2c-uuid");
  });
});

describe("DoorDash provider (mocked HTTP)", () => {
  const dd = createDoorDashProvider(async () => creds);

  it("quotes with the cart id, order value and a ~5 min expiry", async () => {
    const calls = mockFetch([[/POST .*\/drive\/v2\/quotes$/, () => ({ json: { external_delivery_id: "cart1", fee: 975 } })]]);
    const q = await dd.quote({ externalId: "cart1", pickup, dropoff, orderValueCents: 2500 });
    expect(q).toMatchObject({ provider: "doordash_drive", ref: "cart1", feeCents: 975 });
    expect(Date.parse(q.expiresAt!) - Date.now()).toBeLessThanOrEqual(5 * 60_000);
    expect(calls[0].body).toMatchObject({ external_delivery_id: "cart1", order_value: 2500, dropoff_phone_number: "+15550000001" });
    expect(calls[0].headers.Authorization).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it("accepts a fresh quote directly", async () => {
    const calls = mockFetch([
      [/POST .*\/quotes\/cart1\/accept$/, () => ({ json: { external_delivery_id: "cart1", delivery_status: "created", tracking_url: "https://track.test/x" } })],
    ]);
    const r = await dd.dispatch({
      quote: { provider: "doordash_drive", ref: "cart1", feeCents: 975, expiresAt: new Date(Date.now() + 60_000).toISOString() },
      externalId: "cart1", pickup, dropoff, items: [], orderValueCents: 2500, siteUrl: "https://x.test",
    });
    expect(calls).toHaveLength(1);
    expect(r).toEqual({ deliveryId: "cart1", status: "pending", trackingUrl: "https://track.test/x", feeCents: undefined });
  });

  it("re-quotes under a new external id when the quote expired, then accepts that one", async () => {
    const calls = mockFetch([
      [/POST .*\/drive\/v2\/quotes$/, (c) => ({ json: { external_delivery_id: (c.body as { external_delivery_id: string }).external_delivery_id, fee: 1050 } })],
      [/POST .*\/quotes\/cart1\.r\w+\/accept$/, () => ({ json: { external_delivery_id: "cart1.rabc", delivery_status: "confirmed" } })],
    ]);
    const r = await dd.dispatch({
      quote: { provider: "doordash_drive", ref: "cart1", feeCents: 975, expiresAt: new Date(Date.now() - 1000).toISOString() },
      externalId: "cart1", pickup, dropoff, items: [], orderValueCents: 2500, siteUrl: "https://x.test",
    });
    expect(calls.map((c) => c.url.replace("https://openapi.doordash.com", "").replace(/\.r\w+/, ".r*"))).toEqual([
      "/drive/v2/quotes",
      "/drive/v2/quotes/cart1.r*/accept",
    ]);
    expect(cartIdFromExternal(r.deliveryId)).toBe("cart1");
  });

  it("surfaces DoorDash field errors and refuses without credentials", async () => {
    mockFetch([[/quotes$/, () => ({ status: 400, json: { code: "validation_error", field_errors: [{ field: "dropoff_address", error: "invalid" }] } })]]);
    await expect(dd.quote({ externalId: "c", pickup, dropoff, orderValueCents: 1 })).rejects.toThrow("dropoff_address: invalid");
    const none = createDoorDashProvider(async () => null);
    await expect(none.quote({ externalId: "c", pickup, dropoff, orderValueCents: 1 })).rejects.toThrow(/credentials/);
  });
});
