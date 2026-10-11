import { describe, expect, it } from "vitest";
import { cartToPosOrder, pickupIso, type CartForPos } from "@/lib/pos/fromCart";

const item = (over: Partial<CartForPos["items"][number]> = {}): CartForPos["items"][number] => ({
  name: "Burger",
  price: 1149, // unit price incl. modifiers
  quantity: 2,
  orderType: "pickup",
  pickupDay: null,
  pickupTime: null,
  deliveryAddress: null,
  apt: null,
  instructions: null,
  customerName: "Test Customer",
  customerPhone: "+15550000000",
  sides: [{ label: "Bacon", priceInCents: 150 }],
  ...over,
});

describe("cartToPosOrder", () => {
  it("matches the checkout total (price already includes sides — no double count)", () => {
    const o = cartToPosOrder({ id: "c1", uberFeeCents: null, items: [item()] }, { isDelivery: false, timezone: "UTC" });
    expect(o.totalCents).toBe(2298);
    expect(o.lines[0].modifiers).toEqual([{ name: "Bacon", priceCents: 150 }]);
  });

  it("applies promo % to items only and adds the delivery fee", () => {
    const o = cartToPosOrder(
      { id: "c1", uberFeeCents: 599, items: [item({ deliveryAddress: "1 Test St", apt: "4B" })] },
      { isDelivery: true, discountPercent: 10, timezone: "UTC" },
    );
    expect(o.discountCents).toBe(230);
    expect(o.deliveryFeeCents).toBe(599);
    expect(o.totalCents).toBe(2298 - 230 + 599);
    expect(o.fulfillment).toMatchObject({ type: "delivery", deliveryAddress: "1 Test St", note: "Apt/Suite: 4B" });
  });

  it("drops a fake 'N/A' email", () => {
    const o = cartToPosOrder({ id: "c1", uberFeeCents: null, items: [item()] }, { email: "N/A", isDelivery: false, timezone: "UTC" });
    expect(o.customer.email).toBeUndefined();
  });
});

describe("pickupIso", () => {
  const now = new Date("2030-06-01T12:00:00Z");
  it("reads the time in the restaurant's timezone (EDT = UTC-4)", () => {
    expect(pickupIso(new Date("2030-06-01T15:00:00Z"), "6:30 PM", "America/New_York", now)).toBe("2030-06-01T22:30:00.000Z");
    expect(pickupIso(new Date("2030-06-01T15:00:00Z"), "18:30", "America/Chicago", now)).toBe("2030-06-01T23:30:00.000Z");
  });
  it("returns undefined for past or unparseable times (→ ASAP)", () => {
    expect(pickupIso(new Date("2030-06-01T15:00:00Z"), "7:00 AM", "America/New_York", now)).toBeUndefined();
    expect(pickupIso(new Date("2030-06-01T15:00:00Z"), "ASAP", "America/New_York", now)).toBeUndefined();
  });
});
