# 06 — Ops health + care plan

Branch: `feat/ops-health` (stacked on `feat/savings-report`). Flag `ops_health` (it only controls the digest email; the page is read-only and always available).

## Built
- `src/lib/ops/checks.ts` (pure rules) + `health.ts` (fact gathering, each probe isolated).
- `/admin/health`: checks + platform flag states (on / off / killed).
- `/api/ops/health?key=…[&notify=1]`: JSON for a central n8n digest; emails `AGENCY_ALERT_EMAIL` only when there are problems (flag on).
- `docs/ops/CARE_PLAN.md`: what's monitored, response targets, a placeholder tier table and the daily runbook.

## Verified
62 tests pass (6 new rule tests). `tsc` and ESLint clean.

## NEEDS MOHSAL
1. n8n: daily 8am workflow → for each site `GET /api/ops/health?key=…&notify=1` (or omit notify and build one combined digest from the JSON).
2. Set care-plan prices (or drop the idea). Nothing is published anywhere.
