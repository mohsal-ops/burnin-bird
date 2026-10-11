# FINAL — Starvega platform build

Date: 2026-10-11. All new features are behind flags, default **OFF**. Existing sites don't change until a flag is turned on, apart from the owner alert total fix.

## Phases
| # | Phase | State | Report |
|---|---|---|---|
| 0 | Recon, research U1–U7, flags, encryption, tests | done | 00-recon.md |
| 1 | POS adapters: Square + Clover built, Toast/Lightspeed/Shift4 scaffolds, middleware doc | built, **not sandbox-run** | 01-pos-adapters.md |
| 2 | Delivery routing: Uber + DoorDash Drive, router, failover | built, **DoorDash not sandbox-run** | 02-delivery-routing.md |
| 3 | PWA + web push | built, **not tested on a phone** | 03-pwa-push.md |
| 5 | Monthly report | built | 05-savings-report.md |
| 6 | Ops health + alerts + care plan | built | 06-ops-health.md |
| 7 | Funnel & pricing (landing) | built, build passes | vega-star-landing/docs/progress/07-funnel-update.md |
| 8 | Business docs | written | 08-business-docs.md |
| 4 | Native app (Expo) | built, bundle compiles, **not run on a device** | 04-native-app.md |

Tests: **72 unit/contract tests pass** (burnin-bird). `tsc` is clean in all 4 repos, and ESLint is clean on new burnin-bird code. The landing `next build` passes. A burnin-bird production build couldn't complete on this machine (Google Fonts unreachable). The first Vercel preview of `feat/native-app` is the real build check.

## Verified vs mocked
| Thing | Real | Mocked only |
|---|---|---|
| Square/Clover/DoorDash API calls | — | all (fixtures + mocked fetch, built from official docs) |
| Retry/manual-fallback logic, menu diff, router, failover, cart pricing, report maths, health rules, push sending | unit-tested | DB mocked |
| Web push, PWA install, offline menu | — | not run in a browser with flags on |
| Native app | TS + Android bundle compiles | no device run |
| Landing pages | built + sitemap checked | not deployed |

## Shippable today (safe to merge + deploy, all off)
- The whole burnin-bird stack: run the DB migration first (ROLLOUT.md §2).
- The owner alert total fix. It was wrong whenever an order had paid add-ons, a promo or delivery.
- Landing `feat/funnel-update`: 3 new honest /learn pages, the 3-year calculator, and the **Toast $0.99 fee correction**. The old copy claimed a fee Toast removed in July 2023.
- `/admin/health` on every site, the installable app + order push, and the monthly report. These can be switched on per site **now**: they need no outside accounts.

## Blocked on Mohsal
1. **Square** developer app + sandbox token → run `npm run sandbox:square` (or send it to me). Set the redirect URL to the builder relay.
2. **Clover** developer account + sandbox merchant → `npm run sandbox:clover`. Submit the app for Clover approval before the first real Clover client.
3. **DoorDash Drive** sandbox key → `npm run sandbox:doordash`.
4. **n8n**: 4 workflows (ROLLOUT.md §5) and `STARVEGA_JOBS_SECRET` on the client projects.
5. **One real Square (or Clover) restaurant** willing to test end to end before any marketing claim.
6. Confirm add-on and care-plan prices (landing `lib/pricing.ts`, `docs/business/care-plan.md`).
7. US lawyer review of `docs/business/service-agreement-template.md`.
8. Create a GitHub repo for `starvega-native` and push it. Delete the `D:\tmp-sv-export` leftover folder.
9. **Rotate the Brevo API key** if the old local `burnin-bird/.env.example` (which held it, never committed) was ever shared.

## What to demo to a prospect (true today)
- Their own ordering site with **no commission**, card payments to their own Stripe.
- Every order reaches them by email + Telegram + kitchen alarm, and (once `web_push` is on) **a phone notification**.
- Customers can **add the site to their home screen** like an app and get "your order is ready" notifications.
- `/admin/health` and the **monthly "about $X not paid in app fees"** email, stated as an estimate.
- Uber courier delivery (already sold) with tracking.

## Do NOT claim yet
- "Works with Square / Clover / your POS". Wait for a real restaurant on each.
- "Toast / Lightspeed / Shift4 integration". Not available (partner-gated).
- "Uber **and** DoorDash delivery". DoorDash isn't sandbox-tested or live.
- "Your own App Store app". The template exists, but no app has been built or submitted.
- Any exact savings number. Always "estimated at X%".

## Recommended 2-week rollout
| Days | Do |
|---|---|
| 1 | Review + merge the burnin-bird stack. Run the client DB migration. Deploy the panel relay. Deploy the landing branch. |
| 2 | Set `STARVEGA_JOBS_SECRET` (+ `OPS_ALERT_EMAIL`) on all client projects. ⤓ Update batch 1 (≤ 45 sites). |
| 3 | ⤓ Update the remaining sites. Spot-check `/admin/health`. Turn on the daily health digest (n8n + `ops_health`). |
| 4–5 | Pilot `pwa` + `web_push` on 2 friendly sites. Test on an iPhone (16.4+, Home Screen) and an Android phone. Turn on `savings_report` for those sites. |
| 6–7 | Square + DoorDash sandbox runs (after your accounts). Fix whatever the sandboxes disagree with. |
| 8–10 | First real Square restaurant: connect, menu preview, `pos_push` on, watch every order for a week. |
| 11–12 | Roll PWA/push + monthly report out to all sites. Turn on the monthly n8n job. |
| 13–14 | If the Square pilot is clean: flip `pos_square` to `live` on the landing page (publishes the Square page + FAQ) and start selling the POS add-on. Clover follows after approval. |
