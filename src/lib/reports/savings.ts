// Pure maths for the monthly "you kept" report. Every number comes from the
// restaurant's own paid orders; the only assumptions are shown to the owner
// next to the result:
//   • the marketplace commission % they'd otherwise pay (owner-editable)
//   • Stripe's standard US card price, 2.9% + 30¢ per charge
// We never claim more than this: no "extra orders", no invented totals.

export const CARD_PCT = 2.9;
export const CARD_FIXED_CENTS = 30;

export interface ReportOrder {
  /** Food subtotal (what marketplaces take commission on). */
  itemsCents: number;
  /** What the customer was charged (card fee is on this). */
  chargedCents: number;
}

export interface SavingsReport {
  orders: number;
  grossCents: number;
  commissionPct: number;
  commissionAvoidedCents: number;
  cardFeesCents: number;
  keptCents: number;
  avgOrderCents: number;
}

export function computeSavings(orders: ReportOrder[], commissionPct: number): SavingsReport {
  const pct = Math.min(Math.max(commissionPct, 0), 60);
  const grossCents = orders.reduce((s, o) => s + o.itemsCents, 0);
  const commissionAvoidedCents = Math.round((grossCents * pct) / 100);
  const cardFeesCents = orders.reduce(
    (s, o) => s + (o.chargedCents > 0 ? Math.round((o.chargedCents * CARD_PCT) / 100) + CARD_FIXED_CENTS : 0),
    0,
  );
  return {
    orders: orders.length,
    grossCents,
    commissionPct: pct,
    commissionAvoidedCents,
    cardFeesCents,
    keptCents: Math.max(0, commissionAvoidedCents - cardFeesCents),
    avgOrderCents: orders.length ? Math.round(grossCents / orders.length) : 0,
  };
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

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function renderSavingsEmail(r: SavingsReport, restaurant: string, monthLabel: string, dashboardUrl: string): { subject: string; html: string } {
  const row = (k: string, v: string, strong = false) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#78716c">${k}</td><td style="padding:6px 0;text-align:right;${strong ? "font-weight:700;color:#1c1917" : ""}">${v}</td></tr>`;
  if (r.orders === 0) {
    return {
      subject: `${restaurant}: your ${monthLabel} online orders`,
      html: `<div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917;max-width:520px">
        <h2 style="margin:0 0 12px">${monthLabel}</h2>
        <p>No online orders came through your website in ${monthLabel}. Want help getting the link in front of more customers? Just reply to this email.</p></div>`,
    };
  }
  return {
    subject: `${restaurant}: you kept ${usd(r.keptCents)} in ${monthLabel}`,
    html: `<div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917;max-width:520px">
      <h2 style="margin:0 0 4px">You kept ${usd(r.keptCents)} in ${monthLabel}</h2>
      <p style="margin:0 0 16px;color:#78716c">from ${r.orders} order${r.orders === 1 ? "" : "s"} placed on your own website instead of a delivery app.</p>
      <table style="border-collapse:collapse;width:100%">
        ${row("Online food sales", usd(r.grossCents))}
        ${row(`Commission an app would take (${r.commissionPct}%)`, usd(r.commissionAvoidedCents))}
        ${row("Card fees you paid instead (est. 2.9% + 30¢)", `− ${usd(r.cardFeesCents)}`)}
        ${row("Money you kept", usd(r.keptCents), true)}
        ${row("Average order", usd(r.avgOrderCents))}
      </table>
      <p style="margin:18px 0 0;font-size:13px;color:#78716c">The commission rate is the one set in your dashboard. Change it there if your app charges a different rate.
      <a href="${dashboardUrl}" style="color:#1c1917">Open dashboard</a></p></div>`,
  };
}
