# 02 — Delivery routing

Branch: `feat/delivery-routing` (stacked on `feat/pos-adapters`). Flags `delivery_router` and `doordash_drive`, both OFF.

## Built
- `DeliveryProvider` interface (`src/lib/delivery/types.ts`).
- **Uber Direct** wrapper over the untouched `lib/uber.ts` (`uberProvider.ts`).
- **DoorDash Drive** provider (`doordash.ts`): self-signed JWT, quote, accept, re-quote when the 5-minute quote went stale, status mapping. Status webhook at `/api/delivery/doordash/webhook`.
- **Router** (`router.ts`): parallel quotes with an 8 s timeout each, cheapest or fastest, falls back to whichever courier answers.
- Checkout hook (`/api/cart/addDelivery`) and dispatch hook (`finalizeCart`) only take the new path when the flag is on.
- Admin → Delivery → **Couriers** card (only visible with the flag on): strategy, DoorDash keys (encrypted, verified with a live test quote), webhook URL and secret to copy.
- Prisma (additive): `Cart.deliveryProvider`, `Cart.deliveryQuoteExpiresAt`.
- `npm run sandbox:doordash`; docs in `docs/delivery/`.

## Verified
- 44 tests pass in total (12 new: JWT header/claims/signature, status mapping, quote body, accept, stale re-quote, field-error surfacing, missing creds, router cheapest/fastest/ties, error fallback, timeout, all-fail).
- `tsc` and ESLint clean.
- Not run against the DoorDash sandbox: no credentials.

## Honest status
DoorDash: built, not sandbox-tested, not live. Don't advertise "Uber + DoorDash" until one restaurant runs it.

## NEEDS MOHSAL
1. DoorDash Developer Portal: create a sandbox key and run `npm run sandbox:doordash`, or send me the keys.
2. Decide whether restaurants are OK opening their own DoorDash Drive account (my assumption). It keeps us from ever being the merchant of record.
3. Uber per-restaurant credentials are still env/agency-wide (unchanged). Say if you want that moved into admin like DoorDash.

## Update (feat/spec-gaps): aligned to the spec
- Quote timeout is now **4 s**. Policies: cheapest, fastest arrival, or **preferred-with-fallback** (favourite courier, else the cheapest).
- **One failover at dispatch** (`dispatchWithFailover`): if the chosen courier refuses after payment, the other enabled courier is quoted and dispatched once. The owner gets a Telegram note saying who took it. If both fail, the owner is told to arrange delivery or offer pickup. With the router on, ALL routed carts (Uber included) go through this path. Carts with the flag off still use the original Uber block.
- **Who pays**: "I pay this much of each delivery fee" setting. The customer pays the courier fee minus that amount. The real courier fee is stored in the new additive column `Cart.deliveryCourierFeeCents`.
- Admin → Delivery → Couriers: routing form, **Test** buttons for Uber and DoorDash (quote only, nothing dispatched), and a **delivery log** (courier, customer paid, courier cost, status).
- Tests: +4 (preferred, failover ok / failover / both fail). 68 total.
