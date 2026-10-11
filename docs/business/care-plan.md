# Care plan — what we watch, what we fix (draft for Mohsal)

Starvega sites are sold one-time (package tiers). A care plan is the optional monthly add-on covering the work that keeps a live ordering site healthy. **Prices below are placeholders; Mohsal sets them.**

## What the tooling already does (built)
| Signal | Where | Who sees it |
|---|---|---|
| Can the site take payment? (Stripe), alerts configured, uploads, courier set up, POS connected, orders stuck in "new" > 6h, last order date, DB migrated | `/admin/health` | owner + agency |
| Same checks, daily | `GET /api/ops/health?key=…&notify=1` via n8n | agency email only when something is wrong |
| POS order that couldn't be sent | owner Telegram + email immediately | owner |
| Courier dispatch failure | owner Telegram immediately | owner |
| Monthly "you kept" report | owner email (flag) | owner |

## What a care plan includes (proposal)
- Daily health digest reviewed by us; fails fixed same business day, warnings within 3 business days.
- Template updates rolled out (batched, under the 100 deploys/day Vercel limit), DB migrations run first.
- Menu/photo/hours edits on request (owner can also self-serve in admin).
- Integration upkeep: Stripe / POS / courier reconnects, token issues, API version bumps.
- Monthly report email + one-paragraph note from us when something stands out.

## Not included
- Fees from Stripe, Uber, DoorDash, Square/Clover, SMS (paid by the restaurant to those companies).
- New features or custom design work (quoted separately).

## Proposed tiers (placeholders — not live, not on the landing page)
| Tier | For | Price |
|---|---|---|
| Basic | health monitoring + fixes | $__ /mo |
| Plus | + monthly edits + report review | $__ /mo |

## Agency runbook (daily, ~5 min)
1. Read the digest email (only arrives if a site has a problem).
2. Open `<site>/admin/health` for each listed site.
3. Fail → fix now (reconnect Stripe/POS, set env, run migration). Warn → ticket.
4. POS "manual" entries → check the owner actually keyed them in; investigate the cause.
