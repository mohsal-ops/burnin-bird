// Deterministic simulated order activity for the read-only preview dashboard.
// Seeded by days-since-first-preview-visit so the numbers are stable within a
// day but genuinely GROW on return visits — that's the honest "check back"
// signal. Driven by the same estimated orders/day config as the savings math,
// so a lead sees the real "20 orders a day" story. Never used for a real admin.
import { getOutreach } from "./outreach";

function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

export type DemoOrder = { name: string; item: string; amountCents: number; minsAgo: number };

export function previewDemo(daysSince: number) {
  const { savings } = getOutreach();
  const perDay = Math.max(1, savings.estimatedOrdersPerDay);
  const avgCents = Math.round(savings.avgOrderValue * 100);
  const day = Math.max(0, Math.floor(daysSince));

  const todayOrders = Math.round(perDay * (0.9 + 0.25 * seeded(day + 1)));
  const weekOrders = Math.round(perDay * 7 * (0.95 + 0.12 * seeded(day + 2)));
  const revenueTodayCents = todayOrders * avgCents;
  const weekRevenueCents = weekOrders * avgCents;

  // Growth signal that ticks up across return visits (honest day-2 hook).
  const weekDeltaPct = Math.round(6 + day * 3 + seeded(day + 3) * 4);

  // 7-point, upward-trending week sparkline (stable within a day).
  const sparkRevenue = Array.from({ length: 7 }, (_, i) =>
    Math.round(perDay * avgCents * (0.65 + 0.07 * i + 0.12 * seeded(day * 7 + i))),
  );

  const NAMES = ["Ava", "Liam", "Noah", "Mia", "Omar", "Sara", "Jack", "Lucia", "Ethan", "Zoe", "Yusuf", "Nina", "Leo", "Aria"];
  const ITEMS = ["Combo meal", "Family bundle", "Wings (10 pc)", "Loaded fries", "Signature bowl", "Chicken sandwich", "Kids meal", "Side + drink"];
  const count = Math.min(8, Math.max(3, todayOrders));
  const recentOrders: DemoOrder[] = Array.from({ length: count }, (_, i) => ({
    name: NAMES[Math.floor(seeded(day * 131 + i * 7 + 1) * NAMES.length)],
    item: ITEMS[Math.floor(seeded(day * 131 + i * 7 + 2) * ITEMS.length)],
    amountCents: Math.round(savings.avgOrderValue * (0.6 + 0.9 * seeded(day * 131 + i * 7 + 3)) * 100),
    minsAgo: (i + 1) * 6 + Math.floor(seeded(day * 131 + i) * 5),
  }));

  return {
    daysSince: day,
    // Overrides the real getOwnerBriefing() fields in preview mode:
    revenueTodayCents,
    ordersToday: todayOrders,
    weekRevenueCents,
    weekOrders,
    avgOrderCents: avgCents,
    weekDeltaPct,
    sparkRevenue,
    recentOrders,
  };
}
