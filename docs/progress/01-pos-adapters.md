# 01 — POS adapters

Branch: `feat/pos-adapters` (on top of `feat/platform-foundation`) in burnin-bird, plus `feat/pos-adapters` in vegastar-builder-panel (OAuth relay).
Everything is behind flags `pos_push` and `pos_menu_sync`, both OFF. No client site changes behaviour until both a POS is connected AND the flag is turned on.

## Built
| Piece | Where |
|---|---|
| Provider-neutral types + `PosAdapter` interface | `src/lib/pos/types.ts` |
| Square adapter (OAuth, locations, catalog import, CreateOrder → EXTERNAL payment → PayOrder, webhook signature verify) | `src/lib/pos/adapters/square.ts` |
| Clover adapter (OAuth v2, atomic order, external payment on a website tender, print event, menu import) | `src/lib/pos/adapters/clover.ts` |
| Toast / Lightspeed K / Shift4 scaffolds (throw "not available", never touch the network) | `src/lib/pos/adapters/scaffold.ts` |
| Cart → POS order (mirrors checkout math; restaurant-timezone pickup times) | `src/lib/pos/fromCart.ts` |
| Pipeline: hook at the END of `finalizeCart` (after owner alerts), retries 1m/5m/15m/1h/6h, then "enter by hand" alert | `src/lib/pos/pipeline.ts` |
| Encrypted connection storage + token refresh | `src/lib/pos/connection.ts` |
| Menu import preview/apply (links by POS id, then by name; never deletes) | `src/lib/pos/menuPlan.ts`, `menuImport.ts` |
| Routes: `/api/pos/[provider]/connect`, `/callback`, `/api/pos/retry`, `/api/pos/menu-sync` (n8n, `STARVEGA_JOBS_SECRET`) | `src/app/api/pos/` |
| Admin → POS page (connect, location, flags, menu preview/apply, order log with Retry / "I entered it") | `src/app/admin/pos/` |
| Builder OAuth relay (one redirect URL per POS app; forwards only to known Project origins) | panel `src/app/api/pos/oauth/callback/route.ts` |
| Sandbox scripts | `npm run sandbox:square`, `npm run sandbox:clover` |
| Docs | `docs/pos/{square,clover,toast,lightspeed-k,shift4,middleware}.md` |
| Prisma (additive): `PosConnection`, `PosMenuMap`, `PosOrderSync` | `prisma/schema.prisma` |

## Verified
- `npm test`: 32 tests pass. Includes contract tests with mocked HTTP and fixtures for Square and Clover (order bodies, call order, idempotency, retryable vs non-retryable errors, no token in error text, catalog normalisation, webhook HMAC) and pipeline tests (flag off = no-op, send once, mismatch recorded, retry then send, give up to manual + owner alert, max attempts, no scheduler = manual).
- `npx tsc --noEmit` clean. ESLint clean on new files.
- NOT verified against real sandboxes: I don't have Square or Clover sandbox credentials. The scripts are ready.

## Honest status
- **Square: built, not yet sandbox-run.** Do not tell clients "works with Square" until the sandbox script passes AND one real restaurant has it switched on.
- **Clover: built, not yet sandbox-run, and live use needs Clover app approval.** The first sandbox run should confirm a few field names (listed in docs/pos/clover.md).
- **Toast, Lightspeed, Shift4: not available.** Scaffold only.

## Side finding (not changed)
`finalizeCart`'s owner Telegram/email total adds modifier prices on top of `CartItem.price`, but that price already includes modifiers (see `schedualePickupModal`: `finalPrice = price + sides`). It also ignores the promo discount and delivery fee. So the owner alert shows a wrong total whenever an order has paid add-ons, a promo or delivery. The POS path uses the correct checkout math. Worth fixing on its own small branch.

## NEEDS MOHSAL
1. **Square**: create the developer app → send me (or put in the panel's env) the Sandbox Application ID/secret plus a Sandbox access token. I'll run `npm run sandbox:square`. Set the app's OAuth Redirect URL to `https://<builder-domain>/api/pos/oauth/callback`.
2. **Clover**: developer account → sandbox test merchant → API token + merchant id for `npm run sandbox:clover`. Before the first real Clover client, submit the app for approval.
3. **n8n**: add one workflow that calls `GET <site>/api/pos/retry?key=<STARVEGA_JOBS_SECRET>` every 5 min for sites with POS on. Optionally add `/api/pos/menu-sync` every 30 min. Without it, failed pushes go straight to "enter by hand" (safe, but no auto-retry).
4. Run `scripts/migrate-client-dbs.mjs` (panel) **before** porting this branch to any client. It adds the 3 new tables, additive only.
