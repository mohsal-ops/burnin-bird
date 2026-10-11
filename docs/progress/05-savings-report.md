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
