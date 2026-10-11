# 05 — Monthly "you kept" report

Branch: `feat/savings-report` (stacked on `feat/pwa`). Flag `savings_report`, OFF.

## Built
- Pure maths `src/lib/reports/savings.ts`: commission avoided (owner's % × food sales) minus estimated card fees (Stripe standard 2.9% + 30¢ on each charge) = "kept". Restaurant-timezone month bounds. Email renderer.
- Data loader `savingsData.ts`: paid carts in the month (by `createdAt`). Commission % = SiteSetting `savings_commission_pct`, default = the site's outreach `commissionPct`.
- Admin home card: this month so far + last month, with a "How this is worked out" panel and an editable commission %.
- `/api/reports/savings?key=…` for n8n on the 1st of the month: emails last month once (guarded by a `savings_sent:YYYY-MM` row), `?dry=1` to preview. Zero orders gets an honest "no orders" email with no savings claim.

## Honesty rules applied
Only the site's own paid orders. The two assumptions (commission % and card fee estimate) are printed next to every number. No projected or "extra" revenue.

## Verified
56 tests pass (6 new). `tsc` clean.

## NEEDS MOHSAL
1. n8n: monthly workflow (1st, 9am) → `GET <site>/api/reports/savings?key=<STARVEGA_JOBS_SECRET>` for each site with the flag on.
2. Per client, confirm the commission % their old app charged (or leave the outreach default).

## Update (feat/spec-gaps): aligned to the spec
- Formula is now exactly: estimated savings = website-order revenue × commission rate. The rate is a per-site setting, **default 25%**. Every place it appears says "Estimated at X%. Your actual rate may differ." The card-fee subtraction was removed.
- The report now also shows: average order, top 5 items, repeat customers (from the Order history), new loyalty sign-ups (only when loyalty is on), and delivery orders with courier cost.
- With fewer than 5 orders it says the sample is small. With zero orders it sends an honest "no orders" email.
- "Send me a test report" button (goes to the signed-in admin only). "Email me this report every month" toggle. One-click signed unsubscribe link (`/api/reports/unsubscribe`). Plain-text alternative included (`sendMail` gained an optional `text`).
- Email goes through the existing `sendMail` (SMTP) path. That is what the site already uses for owner email; Brevo is only used for loyalty.
