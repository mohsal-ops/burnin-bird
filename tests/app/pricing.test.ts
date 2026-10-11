import { describe, expect, it } from "vitest";
import { priceLine, type PriceItem } from "@/lib/app/pricing";

const item: PriceItem = {
  id: "burger", name: "Burger", priceInCents: 1000, isAvailableForPurchase: true,
  sideGroups: [
    { id: "g1", title: "Size", required: true, maxSelect: 1, options: [{ id: "s", label: "Single", priceInCents: null }, { id: "d", label: "Double", priceInCents: 300 }] },
    { id: "g2", title: "Extras", required: false, maxSelect: 2, options: [{ id: "b", label: "Bacon", priceInCents: 150 }, { id: "c", label: "Cheese", priceInCents: 100 }, { id: "e", label: "Egg", priceInCents: 100 }] },
  ],
};

describe("app cart pricing (server-side, never trusts the app)", () => {
  it("prices from the menu: base + chosen options", () => {
    const r = priceLine(item, 2, ["d", "b"]);
    expect(r).toMatchObject({ unitCents: 1450, quantity: 2 });
  });
  it("enforces required groups and max picks", () => {
    expect(priceLine(item, 1, ["b"])).toEqual({ error: "Please choose: Size (Burger)." });
    expect(priceLine(item, 1, ["s", "b", "c", "e"])).toEqual({ error: "Too many choices for Extras." });
  });
  it("rejects options from other items, unavailable items and silly quantities", () => {
    expect(priceLine(item, 1, ["s", "not-mine"])).toHaveProperty("error");
    expect(priceLine({ ...item, isAvailableForPurchase: false }, 1, ["s"])).toHaveProperty("error");
    expect(priceLine(undefined, 1, [])).toHaveProperty("error");
    expect(priceLine(item, 0, ["s"])).toHaveProperty("error");
    expect(priceLine(item, 51, ["s"])).toHaveProperty("error");
  });
});
