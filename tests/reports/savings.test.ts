import { describe, expect, it } from "vitest";
import {
  aggregateMonth,
  estimateSavings,
  monthBounds,
  previousMonth,
  renderReportEmail,
  type MonthStats,
} from "@/lib/reports/savings";

const links = { dashboard: "https://x.test/admin", unsubscribe: "https://x.test/u?t=abc" };

describe("aggregateMonth", () => {
  it("counts orders, revenue, top items, delivery orders and courier cost", () => {
    const s = aggregateMonth(
      [
        { items: [{ name: "Burger", price: 1000, quantity: 2 }, { name: "Fries", price: 400, quantity: 1 }], isDelivery: false, courierFeeCents: 0 },
        { items: [{ name: "Burger", price: 1000, quantity: 1 }], isDelivery: true, courierFeeCents: 799 },
        { items: [], isDelivery: false, courierFeeCents: 0 }, // empty cart ignored
      ],
      "October 2026",
    );
    expect(s).toMatchObject({ orders: 2, revenueCents: 3400, avgOrderCents: 1700, deliveryOrders: 1, courierCostCents: 799 });
    expect(s.topItems[0]).toEqual({ name: "Burger", qty: 3, revenueCents: 3000 });
  });
});

describe("estimateSavings", () => {
  it("is revenue × rate, clamped", () => {
    expect(estimateSavings(10000, 25)).toBe(2500);
    expect(estimateSavings(10000, 500)).toBe(6000);
    expect(estimateSavings(10000, -5)).toBe(0);
  });
});

describe("month bounds", () => {
  it("uses the restaurant's timezone (Chicago, DST)", () => {
    const b = monthBounds(2026, 9, "America/Chicago");
    expect(b.start.toISOString()).toBe("2026-10-01T05:00:00.000Z");
    expect(b.end.toISOString()).toBe("2026-11-01T05:00:00.000Z");
    expect(b.label).toBe("October 2026");
  });
  it("previous month wraps the year and respects the timezone", () => {
    expect(previousMonth(new Date("2027-01-01T12:00:00Z"), "America/New_York")).toEqual({ year: 2026, month0: 11 });
    expect(previousMonth(new Date("2027-01-01T03:00:00Z"), "America/Los_Angeles")).toEqual({ year: 2026, month0: 10 });
  });
});

const stats = (over: Partial<MonthStats> = {}): MonthStats => ({
  label: "October 2026", orders: 12, revenueCents: 30000, avgOrderCents: 2500,
  topItems: [{ name: "Burger", qty: 9, revenueCents: 9000 }], repeatCustomers: 3, newLoyaltySubscribers: null,
  deliveryOrders: 0, courierCostCents: 0, ...over,
});

describe("report email", () => {
  it("states the assumption in plain words and never as exact", () => {
    const e = renderReportEmail(stats(), 25, "Test Grill", links);
    expect(e.subject).toBe("Test Grill: about $75.00 saved in October 2026");
    expect(e.html).toContain("Estimated at 25%. Your actual rate may differ.");
    expect(e.text).toContain("Estimated at 25%. Your actual rate may differ.");
    expect(e.html).toContain(links.unsubscribe);
    expect(e.text).toContain("Unsubscribe");
    expect(e.html).not.toContain("loyalty"); // loyalty off → not mentioned
  });
  it("small sample → says so", () => {
    expect(renderReportEmail(stats({ orders: 2 }), 25, "T", links).text).toContain("small sample");
  });
  it("zero orders → no savings claim", () => {
    const e = renderReportEmail(stats({ orders: 0, revenueCents: 0, topItems: [] }), 25, "T", links);
    expect(e.subject).not.toContain("saved");
    expect(e.text).toContain("No orders");
  });
  it("escapes item names", () => {
    expect(renderReportEmail(stats({ topItems: [{ name: "<b>x</b>", qty: 1, revenueCents: 1 }] }), 25, "T", links).html).toContain("&lt;b&gt;");
  });
});
