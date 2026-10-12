import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCloverOrder, cloverAdapter, normaliseCloverMenu } from "@/lib/pos/adapters/clover";
import type { PosContext } from "@/lib/pos/types";
import fx from "../fixtures/pos/clover-items.json";
import { mockFetch, sampleOrder } from "./helpers";

const ctx: PosContext = { environment: "sandbox", merchantId: "MERCH1", creds: { accessToken: "clover-test-token" } };
afterEach(() => vi.unstubAllGlobals());

describe("Clover order body", () => {
  it("repeats lines per quantity and keeps the total equal to what was charged", () => {
    const body = buildCloverOrder(sampleOrder());
    expect(body.orderCart.lineItems).toHaveLength(3);
    const total = body.orderCart.lineItems.reduce(
      (s, l) => s + l.price + (l.modifications ?? []).reduce((m, x) => m + x.amount, 0),
      0,
    );
    expect(total).toBe(sampleOrder().totalCents);
    expect(body.orderCart.note).toContain("ref cart_test_123");
  });

  it("adds delivery fee as a line and the promo as a negative discount", () => {
    const body = buildCloverOrder(
      sampleOrder({
        fulfillment: { type: "delivery", deliveryAddress: "1 Test St", timezone: "America/New_York" },
        deliveryFeeCents: 599,
        discountCents: 200,
      }),
    );
    expect(body.orderCart.lineItems.at(-1)).toEqual({ name: "Delivery fee", price: 599 });
    expect(body.orderCart.discounts).toEqual([{ name: "Online promo", amount: -200 }]);
    expect(body.orderCart.note).toContain("DELIVERY (courier) to: 1 Test St");
  });
});

describe("Clover pushOrder (mocked HTTP)", () => {
  const routes = (paidAlready = false) =>
    mockFetch([
      [/POST .*\/atomic_order\/orders$/, () => ({ json: { id: "CL_ORDER", total: 2697 } })],
      [/GET .*\/tenders/, () => ({ json: { elements: [{ id: "T_EXT", labelKey: "com.clover.tender.external_payment" }] } })],
      [/GET .*\/orders\/CL_ORDER\/payments/, () => ({ json: { elements: paidAlready ? [{ externalPaymentId: "sv-cart_test_123" }] : [] } })],
      [/POST .*\/orders\/CL_ORDER\/payments$/, () => ({ json: { id: "CL_PAY" } })],
      [/POST .*\/orders\/CL_ORDER$/, () => ({ json: { id: "CL_ORDER", state: "locked" } })],
      [/POST .*\/print_event$/, () => ({ json: {} })],
    ]);

  it("creates order, records external payment, prints, and reports the id via onCreated", async () => {
    const calls = routes();
    const onCreated = vi.fn(async () => {});
    const r = await cloverAdapter.pushOrder(ctx, sampleOrder(), { onCreated });
    expect(r).toEqual({ posOrderId: "CL_ORDER", posTotalCents: 2697 });
    expect(onCreated).toHaveBeenCalledWith("CL_ORDER");
    const pay = calls.find((c) => c.method === "POST" && c.url.endsWith("/orders/CL_ORDER/payments"));
    expect(pay?.body).toMatchObject({ tender: { id: "T_EXT" }, amount: 2697, result: "SUCCESS" });
    expect(calls[0].url).toBe("https://apisandbox.dev.clover.com/v3/merchants/MERCH1/atomic_order/orders");
    expect(calls[0].headers.Authorization).toBe("Bearer clover-test-token");
    expect((calls[0].body as { orderCart: { title: string } }).orderCart.title).toMatch(/^PAID ONLINE - DO NOT CHARGE/);
    expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/orders/CL_ORDER") && (c.body as { state?: string }).state === "locked")).toBe(true);
  });

  it("on retry with an existing order id, never creates a second order or a second payment", async () => {
    const calls = routes(true);
    await cloverAdapter.pushOrder(ctx, sampleOrder(), { existingPosOrderId: "CL_ORDER" });
    expect(calls.some((c) => c.url.includes("atomic_order"))).toBe(false);
    expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/payments"))).toBe(false);
  });
});

describe("Clover menu import", () => {
  it("normalises items + modifier groups, skips hidden", () => {
    const menu = normaliseCloverMenu(fx.items as never, fx.groups as never);
    expect(menu.items.map((i) => i.name)).toEqual(["Wings (6)", "Fries"]);
    expect(menu.items[0].modifierGroups[0]).toMatchObject({ name: "Sauce", required: true, maxSelect: 1 });
    expect(menu.items[1].available).toBe(false);
  });
});
