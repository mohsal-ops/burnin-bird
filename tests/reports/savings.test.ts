import { describe, expect, it } from "vitest";
import { computeSavings, monthBounds, previousMonth, renderSavingsEmail } from "@/lib/reports/savings";

describe("computeSavings", () => {
  it("commission avoided minus real card fees, from the owner's own orders", () => {
    const r = computeSavings(
      [
        { itemsCents: 2000, chargedCents: 2000 },
        { itemsCents: 3000, chargedCents: 3599 }, // delivery fee charged, not commissionable
      ],
      30,
    );
    expect(r.grossCents).toBe(5000);
    expect(r.commissionAvoidedCents).toBe(1500);
    // 2.9% of 2000 = 58 + 30, 2.9% of 3599 = 104 + 30
    expect(r.cardFeesCents).toBe(58 + 30 + 104 + 30);
    expect(r.keptCents).toBe(1500 - 222);
    expect(r.avgOrderCents).toBe(2500);
  });

  it("never reports negative savings and clamps silly rates", () => {
    expect(computeSavings([{ itemsCents: 100, chargedCents: 100 }], 1).keptCents).toBe(0);
    expect(computeSavings([], 500).commissionPct).toBe(60);
    expect(computeSavings([], 30)).toMatchObject({ orders: 0, keptCents: 0, avgOrderCents: 0 });
  });
});

describe("month bounds", () => {
  it("uses the restaurant's timezone (Chicago, DST)", () => {
    const b = monthBounds(2026, 9, "America/Chicago"); // October 2026
    expect(b.start.toISOString()).toBe("2026-10-01T05:00:00.000Z");
    expect(b.end.toISOString()).toBe("2026-11-01T05:00:00.000Z");
    expect(b.label).toBe("October 2026");
  });
  it("previous month wraps the year", () => {
    expect(previousMonth(new Date("2027-01-01T12:00:00Z"), "America/New_York")).toEqual({ year: 2026, month0: 11 });
    // Still Dec 31 in Los Angeles at 03:00 UTC on Jan 1 → previous = November
    expect(previousMonth(new Date("2027-01-01T03:00:00Z"), "America/Los_Angeles")).toEqual({ year: 2026, month0: 10 });
  });
});

describe("savings email", () => {
  it("states the assumptions next to the number", () => {
    const r = computeSavings([{ itemsCents: 10000, chargedCents: 10000 }], 25);
    const e = renderSavingsEmail(r, "Test Grill", "October 2026", "https://x.test/admin");
    // 25% of $100 = $25.00, minus card fee $2.90 + $0.30 = $21.80
    expect(e.subject).toBe("Test Grill: you kept $21.80 in October 2026");
    expect(e.html).toContain("(25%)");
    expect(e.html).toContain("2.9% + 30¢");
  });
  it("zero orders → honest no-orders email, no savings claim", () => {
    const e = renderSavingsEmail(computeSavings([], 25), "Test Grill", "October 2026", "https://x.test/admin");
    expect(e.subject).not.toContain("kept");
    expect(e.html).toContain("No online orders");
  });
});
