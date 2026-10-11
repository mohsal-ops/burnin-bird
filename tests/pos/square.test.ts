import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  buildSquareOrder,
  normaliseSquareCatalog,
  squareAdapter,
  SQUARE_VERSION,
  verifySquareSignature,
} from "@/lib/pos/adapters/square";
import { PosError, type PosContext } from "@/lib/pos/types";
import catalog from "../fixtures/pos/square-catalog.json";
import { mockFetch, sampleOrder } from "./helpers";

const ctx: PosContext = { environment: "sandbox", locationId: "LOC1", creds: { accessToken: "EAAA-test-token" } };

afterEach(() => vi.unstubAllGlobals());

describe("Square order body", () => {
  it("splits modifier prices out of the unit price so totals match", () => {
    const body = buildSquareOrder(sampleOrder(), "LOC1");
    const burger = body.order.line_items[0];
    expect(burger.quantity).toBe("2");
    expect(burger.base_price_money.amount).toBe(999);
    expect(burger.modifiers[0]).toEqual({ name: "Bacon", base_price_money: { amount: 150, currency: "USD" } });
    const total = body.order.line_items.reduce(
      (s, l) =>
        s + (l.base_price_money.amount + l.modifiers.reduce((m, x) => m + x.base_price_money.amount, 0)) * Number(l.quantity),
      0,
    );
    expect(total).toBe(sampleOrder().totalCents);
  });

  it("is idempotent per cart and sends delivery as PICKUP with the address in the note", () => {
    const body = buildSquareOrder(
      sampleOrder({
        fulfillment: { type: "delivery", deliveryAddress: "1 Test St", timezone: "America/New_York" },
        deliveryFeeCents: 599,
        discountCents: 100,
      }),
      "LOC1",
    );
    expect(body.idempotency_key).toBe("sv-order-cart_test_123");
    const f = body.order.fulfillments[0];
    expect(f.type).toBe("PICKUP");
    expect(f.pickup_details.note).toContain("DELIVERY (courier) to: 1 Test St");
    expect(body.order.service_charges?.[0].amount_money.amount).toBe(599);
    expect(body.order.discounts?.[0].amount_money.amount).toBe(100);
  });
});

describe("Square pushOrder (mocked HTTP)", () => {
  it("creates order → EXTERNAL payment → PayOrder, in that order", async () => {
    const calls = mockFetch([
      [/POST .*\/v2\/orders$/, () => ({ json: { order: { id: "SQ_ORDER", total_money: { amount: 2697 } } } })],
      [/POST .*\/v2\/payments$/, () => ({ json: { payment: { id: "SQ_PAY", status: "APPROVED" } } })],
      [/POST .*\/v2\/orders\/SQ_ORDER\/pay$/, () => ({ json: { order: { id: "SQ_ORDER", state: "OPEN" } } })],
    ]);
    const r = await squareAdapter.pushOrder(ctx, sampleOrder());
    expect(r).toEqual({ posOrderId: "SQ_ORDER", posTotalCents: 2697 });
    expect(calls.map((c) => c.url.replace("https://connect.squareupsandbox.com", ""))).toEqual([
      "/v2/orders",
      "/v2/payments",
      "/v2/orders/SQ_ORDER/pay",
    ]);
    expect(calls[0].headers["Square-Version"]).toBe(SQUARE_VERSION);
    expect(calls[0].headers.Authorization).toBe("Bearer EAAA-test-token");
    const pay = calls[1].body as Record<string, unknown>;
    expect(pay.source_id).toBe("EXTERNAL");
    expect(pay.amount_money).toEqual({ amount: 2697, currency: "USD" });
    expect(pay.autocomplete).toBe(false);
    expect((calls[2].body as { payment_ids: string[] }).payment_ids).toEqual(["SQ_PAY"]);
  });

  it("marks 5xx as retryable and 4xx as not", async () => {
    mockFetch([[/POST .*\/v2\/orders$/, () => ({ status: 503, json: { errors: [{ code: "SERVICE_UNAVAILABLE" }] } })]]);
    await expect(squareAdapter.pushOrder(ctx, sampleOrder())).rejects.toMatchObject({ retryable: true, status: 503 });

    mockFetch([[/POST .*\/v2\/orders$/, () => ({ status: 400, json: { errors: [{ code: "INVALID_VALUE", detail: "bad" }] } })]]);
    const err = await squareAdapter.pushOrder(ctx, sampleOrder()).catch((e) => e);
    expect(err).toBeInstanceOf(PosError);
    expect(err.retryable).toBe(false);
    expect(err.message).toContain("INVALID_VALUE: bad");
    expect(err.message).not.toContain("EAAA-test-token");
  });

  it("refuses without a location", async () => {
    await expect(squareAdapter.pushOrder({ ...ctx, locationId: null }, sampleOrder())).rejects.toMatchObject({
      retryable: false,
    });
  });
});

describe("Square catalog import", () => {
  it("normalises items, variations, sold-out and modifiers; skips archived/deleted", () => {
    const menu = normaliseSquareCatalog(catalog.objects as never, "LOC1");
    expect(menu.items.map((i) => i.name)).toEqual(["Smash Burger (Single)", "Smash Burger (Double)"]);
    expect(menu.items[0]).toMatchObject({ posId: "VAR1", priceCents: 999, category: "Burgers", available: true });
    expect(menu.items[1].available).toBe(false);
    expect(menu.items[0].modifierGroups[0].modifiers[0]).toEqual({ posId: "MOD1", name: "Bacon", priceCents: 150 });
  });

  it("pages through the catalog with the cursor", async () => {
    let n = 0;
    const calls = mockFetch([
      [
        /GET .*\/v2\/catalog\/list/,
        () => (n++ === 0 ? { json: { objects: catalog.objects.slice(0, 2), cursor: "NEXT" } } : { json: { objects: catalog.objects.slice(2) } }),
      ],
    ]);
    const menu = await squareAdapter.importMenu(ctx);
    expect(calls).toHaveLength(2);
    expect(calls[1].url).toContain("cursor=NEXT");
    expect(menu.items).toHaveLength(2);
  });
});

describe("Square webhook signature", () => {
  it("accepts a valid signature and rejects a forged one", async () => {
    const key = "test-signature-key";
    const url = "https://example.test/api/pos/square/webhook";
    const rawBody = JSON.stringify({ type: "catalog.version.updated" });
    const signature = createHmac("sha256", key).update(url + rawBody).digest("base64");
    expect(await verifySquareSignature({ rawBody, signature, notificationUrl: url, signatureKey: key })).toBe(true);
    expect(await verifySquareSignature({ rawBody: rawBody + " ", signature, notificationUrl: url, signatureKey: key })).toBe(false);
    expect(await verifySquareSignature({ rawBody, signature: null, notificationUrl: url, signatureKey: key })).toBe(false);
  });
});
