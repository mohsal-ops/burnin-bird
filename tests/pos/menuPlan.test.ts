import { describe, expect, it } from "vitest";
import { planMenuImport, slugify } from "@/lib/pos/menuPlan";
import type { PosMenuItem } from "@/lib/pos/types";

const pos = (posId: string, name: string, priceCents: number, available = true): PosMenuItem => ({
  posId, name, priceCents, available, category: "Menu", modifierGroups: [],
});

describe("planMenuImport", () => {
  const local = [
    { id: "a", name: "Smash Burger", priceInCents: 999, isAvailableForPurchase: true },
    { id: "b", name: "Fries", priceInCents: 399, isAvailableForPurchase: true },
    { id: "c", name: "Secret Menu Item", priceInCents: 500, isAvailableForPurchase: true },
  ];

  it("uses links first, then names, and never touches items the POS lacks", () => {
    const plan = planMenuImport(
      { items: [pos("V1", "Totally Renamed Burger", 1099), pos("V2", "  fries ", 399, false), pos("V3", "Shake", 599)] },
      local,
      [{ localId: "a", posId: "V1" }],
    );
    expect(plan.actions[0]).toMatchObject({ kind: "update", itemId: "a", link: false, changes: ["price $9.99 → $10.99"] });
    expect(plan.actions[1]).toMatchObject({ kind: "update", itemId: "b", link: true, changes: ["sold out"] });
    expect(plan.actions[2]).toMatchObject({ kind: "create" });
    expect(plan.notInPos.map((l) => l.id)).toEqual(["c"]);
    expect(plan.counts).toEqual({ update: 2, same: 0, create: 1, notInPos: 1 });
  });

  it("doesn't link two POS items to the same local item", () => {
    const plan = planMenuImport({ items: [pos("V1", "Fries", 399), pos("V2", "fries", 399)] }, local, []);
    expect(plan.actions.map((a) => a.kind)).toEqual(["same", "create"]);
  });

  it("slugifies safely", () => {
    expect(slugify("Jalapeño Poppers (6)!")).toBe("jalapeno-poppers-6");
    expect(slugify("!!!")).toBe("item");
  });
});
