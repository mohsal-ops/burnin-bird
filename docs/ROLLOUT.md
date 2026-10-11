# Rollout: porting the platform build to client sites

Everything ships **OFF**. Deploying this code changes nothing on a client site until a flag is turned on for that site. One exception: the owner alert total fix (`finalizeCart`), which is a correction.

## 1. Branches (merge order)
burnin-bird branches are **stacked**. Each one contains the ones before it:

```
main
 └ feat/platform-foundation   (flags, encryption, tests)
    └ feat/pos-adapters        (Square/Clover/…)
       └ feat/delivery-routing (DoorDash + router)
          └ feat/pwa           (installable app + push)
             └ feat/savings-report
                └ feat/ops-health
                   └ feat/spec-gaps   (aligns phases 1–6 with the spec)
                      └ feat/native-app  (app API + alert-total fix + these docs)
docs/business (from main, docs only)
```
Review commit by commit, then open **one PR: `feat/native-app` → `main`** (it contains the whole stack) and a separate PR for `docs/business`.

Other repos:
- vegastar-builder-panel `feat/pos-adapters`: POS OAuth relay `/api/pos/oauth/callback`.
- vega-star-landing `feat/funnel-update`: feature registry, add-ons (hidden), new /learn pages, calculator, Toast fee correction.
- starvega-native: new local repo, not pushed yet.

## 2. Before any client gets the new code
1. **Database first.** In the panel: `node scripts/migrate-client-dbs.mjs` with `TEMPLATE_DIR` pointing at the merged burnin-bird. It runs `prisma db push`, which is additive.
   - New tables: `PosConnection`, `PosMenuMap`, `PosOrderSync`, `PushSubscription`.
   - New Cart columns: `deliveryProvider`, `deliveryQuoteExpiresAt`, `deliveryCourierFeeCents`.
   - Deploying code before this is safe: every new read is wrapped and behaves as "off". But `/admin/health` will show "Database up to date: warn".
2. **Env on every client project** (only what each site needs):
   - all sites: `STARVEGA_JOBS_SECRET` (one random value, used by n8n) and optionally `OPS_ALERT_EMAIL`
   - POS sites: `SQUARE_APPLICATION_ID`, `SQUARE_APPLICATION_SECRET` (+ sandbox pair), `CLOVER_APP_ID`, `CLOVER_APP_SECRET`, `POS_OAUTH_REDIRECT_URL=https://<builder>/api/pos/oauth/callback`
   - Do it the same way R2 was done (copy env into every project from the panel), and **batch it**.
3. Merge and deploy the panel `feat/pos-adapters` (relay) before any POS connect.

## 3. Syncing client sites
- Use ⤓ Update **in batches**. Vercel Hobby allows 100 deploys a day, and each ⤓ Update currently causes 2 builds (known double-deploy issue). So **≤ 45 sites per day**.
- **Never full-sync Southern-Jerks** (port selectively, if at all).
- After each batch, open `<site>/admin/health` on 2–3 sites. Expect all green/off, with "Database up to date" ok.

## 4. Turning a feature on for ONE site (pilot first)
| Feature | Turn on | Needs first |
|---|---|---|
| POS (Square) | admin → `/admin/pos` → Connect → choose location → "Send orders to POS" | Square app creds in env; relay deployed; sandbox script passed; owner agrees to be the first real test |
| POS (Clover) | same page | Clover app **approved by Clover** |
| Menu sync | `/admin/pos` → "Keep menu in sync" + n8n `/api/pos/menu-sync` | POS connected; run "Check menu" once and review the preview |
| Delivery router / DoorDash | flag `delivery_router` (agency), then owner pastes DoorDash keys in admin → Delivery → Couriers | restaurant's own DoorDash Drive account |
| Installable app + push | admin → App (`pwa`, `web_push`) | nothing (VAPID keys self-generate) |
| Monthly report | flag `savings_report` + n8n monthly job | set the commission % in the card |
| Health digest | flag `ops_health` + n8n daily job | `OPS_ALERT_EMAIL` or `AGENCY_ALERT_EMAIL` |
| Native app API | admin → App → "Your App Store app" | client bought the app |

How flags are set: most have a toggle in the admin pages above. Otherwise there's the `SiteSetting` row `flag:<name>` = `1`.

## 5. n8n jobs (one workflow each, looping over the site list)
| Job | Schedule | Call |
|---|---|---|
| POS retry | every 2 min (POS sites only) | `GET <site>/api/pos/retry?key=<STARVEGA_JOBS_SECRET>` |
| POS menu sync | every 30 min, opening hours | `GET <site>/api/pos/menu-sync?key=…` |
| Monthly report | 1st of month, 9am | `GET <site>/api/reports/savings?key=…` (add `&dry=1` to preview) |
| Health digest | daily 8am | `GET <site>/api/ops/health?key=…&notify=1` |

Each idle call is one or two indexed queries, so they cost very little of the Fluid CPU budget.

## 6. Emergency off (no redeploy of code needed)
- One feature on one site: turn its toggle off, or set env `STARVEGA_KILL_<FLAG>=1` (e.g. `STARVEGA_KILL_POS_PUSH=1`) and redeploy that project.
- Everything new on a site: `STARVEGA_KILL_ALL=1`.
- Orders never depend on the new features. The owner email, Telegram and kitchen alarm always fire first.

## 7. Landing page
Deploy `feat/funnel-update` as-is (add-ons and POS pages stay hidden). Flip `lib/features.ts` statuses only after real-client proof.
