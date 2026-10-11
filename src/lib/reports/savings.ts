// Pure maths + rendering for the monthly report. Every number comes from the
// restaurant's own paid website orders. The ONE assumption — the marketplace
// commission rate (per-site setting, default 25%) — is stated in plain words
// next to the estimate, which is never presented as exact.

export const DEFAULT_COMMISSION_PCT = 25;
/** Below this many orders the estimate is shown with an honest "small sample" note. */
export const MIN_ORDERS_FOR_ESTIMATE = 5;

export interface ReportCart {
  items: { name: string | null; price: number | null; quantity: number | null }[];
  isDelivery: boolean;
  /** Courier fee on the order (what the courier charged; customer paid it at checkout). */
  courierFeeCents: number;
}

export interface MonthStats {
  label: string;
  orders: number;
  revenueCents: number;
  avgOrderCents: number;
  topItems: { name: string; qty: number; revenueCents: number }[];
  /** Customers this month who had ordered before. null = can't tell (no data). */
  repeatCustomers: number | null;
  /** New loyalty sign-ups this month. null = loyalty is off. */
  newLoyaltySubscribers: number | null;
  deliveryOrders: number;
  courierCostCents: number;
}

export function aggregateMonth(carts: ReportCart[], label: string): Omit<MonthStats, "repeatCustomers" | "newLoyaltySubscribers"> {
  const items = new Map<string, { qty: number; revenueCents: number }>();
  let revenueCents = 0;
  let deliveryOrders = 0;
  let courierCostCents = 0;
  const real = carts.filter((c) => c.items.length);
  for (const c of real) {
    for (const i of c.items) {
      const q = i.quantity ?? 1;
      const r = (i.price ?? 0) * q;
      revenueCents += r;
      if (!i.name) continue;
      const cur = items.get(i.name) ?? { qty: 0, revenueCents: 0 };
      items.set(i.name, { qty: cur.qty + q, revenueCents: cur.revenueCents + r });
    }
    if (c.isDelivery) {
      deliveryOrders++;
      courierCostCents += c.courierFeeCents;
    }
  }
  return {
    label,
    orders: real.length,
    revenueCents,
    avgOrderCents: real.length ? Math.round(revenueCents / real.length) : 0,
    topItems: [...items.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty || b.revenueCents - a.revenueCents)
      .slice(0, 5),
    deliveryOrders,
    courierCostCents,
  };
}

/** Estimated commission a marketplace would have taken. */
export function estimateSavings(revenueCents: number, commissionPct: number): number {
  const pct = Math.min(Math.max(commissionPct, 0), 60);
  return Math.round((revenueCents * pct) / 100);
}

/** [start, end) of a calendar month in the restaurant's timezone, as UTC instants. */
export function monthBounds(year: number, month0: number, tz: string): { start: Date; end: Date; label: string } {
  const at = (y: number, m: number) => {
    const wall = Date.UTC(y, m, 1, 0, 0);
    const offset = (t: number) => {
      const p = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", {
          timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
        })
          .formatToParts(new Date(t))
          .map((x) => [x.type, x.value]),
      );
      return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t;
    };
    let t = wall - offset(wall);
    t = wall - offset(t);
    return new Date(t);
  };
  const next = month0 === 11 ? [year + 1, 0] : [year, month0 + 1];
  const label = new Date(Date.UTC(year, month0, 15)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { start: at(year, month0), end: at(next[0], next[1]), label };
}

/** The calendar month before `now` in tz. */
export function previousMonth(now: Date, tz: string): { year: number; month0: number } {
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  return m === 1 ? { year: y - 1, month0: 11 } : { year: y, month0: m - 2 };
}

export const usd = (c: number) =>
  `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderReportEmail(
  s: MonthStats,
  commissionPct: number,
  restaurant: string,
  links: { dashboard: string; unsubscribe: string },
): { subject: string; html: string; text: string } {
  const est = estimateSavings(s.revenueCents, commissionPct);
  const assumption = `Estimated at ${commissionPct}%. Your actual rate may differ.`;

  if (s.orders === 0) {
    const body = `No orders came in through your website in ${s.label}. Want help getting your ordering link in front of more customers? Just reply to this email.`;
    return {
      subject: `${restaurant}: your ${s.label} website orders`,
      html: wrap(`<h2 style="margin:0 0 12px;font-size:20px">${s.label}</h2><p>${body}</p>`, links),
      text: `${s.label}\n\n${body}\n\nUnsubscribe: ${links.unsubscribe}`,
    };
  }

  const lines: [string, string][] = [
    ["Website orders", String(s.orders)],
    ["Sales from those orders", usd(s.revenueCents)],
    ["Average order", usd(s.avgOrderCents)],
  ];
  if (s.repeatCustomers !== null) lines.push(["Repeat customers", String(s.repeatCustomers)]);
  if (s.newLoyaltySubscribers !== null) lines.push(["New loyalty sign-ups", String(s.newLoyaltySubscribers)]);
  if (s.deliveryOrders > 0) lines.push([`Delivery orders (${s.deliveryOrders})`, `courier cost ${usd(s.courierCostCents)}`]);

  const small = s.orders < MIN_ORDERS_FOR_ESTIMATE
    ? `Only ${s.orders} order${s.orders === 1 ? "" : "s"} so far, so this is a small sample.`
    : "";

  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#57534e">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(v)}</td></tr>`;
  const html = wrap(
    `<p style="margin:0 0 4px;color:#57534e">${s.label} on your website</p>
     <h2 style="margin:0 0 4px;font-size:22px">About ${usd(est)} you didn't pay in app fees</h2>
     <p style="margin:0 0 16px;font-size:13px;color:#78716c">${assumption}${small ? ` ${small}` : ""}</p>
     <table style="border-collapse:collapse;width:100%;font-size:15px">${lines.map(([k, v]) => row(k, v)).join("")}</table>
     ${
       s.topItems.length
         ? `<p style="margin:18px 0 6px;font-weight:600">Top items</p><ol style="margin:0;padding-left:20px">${s.topItems
             .map((t) => `<li>${esc(t.name)}: ${t.qty} sold</li>`)
             .join("")}</ol>`
         : ""
     }`,
    links,
  );
  const text = [
    `${s.label} on your website`,
    `About ${usd(est)} you didn't pay in app fees.`,
    assumption,
    small,
    "",
    ...lines.map(([k, v]) => `${k}: ${v}`),
    ...(s.topItems.length ? ["", "Top items:", ...s.topItems.map((t, i) => `${i + 1}. ${t.name}: ${t.qty} sold`)] : []),
    "",
    `Dashboard: ${links.dashboard}`,
    `Unsubscribe from this monthly email: ${links.unsubscribe}`,
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");
  return { subject: `${restaurant}: about ${usd(est)} saved in ${s.label}`, html, text };
}

function wrap(inner: string, links: { dashboard: string; unsubscribe: string }) {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.5;color:#1c1917;max-width:520px;margin:0 auto;padding:16px">
    ${inner}
    <p style="margin:20px 0 0"><a href="${links.dashboard}" style="background:#1c1917;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Open dashboard</a></p>
    <p style="margin:24px 0 0;font-size:12px;color:#a8a29e">You get this because you own this website. <a href="${links.unsubscribe}" style="color:#a8a29e">Stop these monthly emails</a>.</p>
  </div>`;
}
