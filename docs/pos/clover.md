# Clover — status: BUILT, NEEDS CLOVER APPROVAL for real merchants

## What it does
- OAuth v2 (`/oauth/v2/authorize` → `/oauth/v2/token`, merchant id comes on the redirect). Refresh via `/oauth/v2/refresh`.
- Orders: `atomic_order/orders` (quantity = repeated line items, Clover's model; modifiers as `modifications`; promo as negative discount; delivery fee as a line) → external payment on a "Website (paid online)" tender (created once if missing) → `print_event` so the kitchen printer fires.
- No idempotency keys in Clover → the pipeline saves the Clover order id the moment it exists and, on retry, reuses it and checks `externalPaymentId` before paying, so no duplicate tickets or payments.
- Menu import: `items?expand=categories,modifierGroups` + `modifier_groups?expand=modifiers`.

## Setup
1. sandbox.dev.clover.com → developer account → create app; permissions: Orders R/W, Inventory R, Payments W, Merchant R.
2. Site URL / redirect = builder relay (one per app).
3. Env: `CLOVER_APP_ID`, `CLOVER_APP_SECRET`.
4. **Before the first real Clover client**: submit the app for Clover approval (required even for private single-merchant apps — docs/research/U3).

## Verify
- `npm test`
- `CLOVER_SANDBOX_TOKEN=… CLOVER_SANDBOX_MERCHANT_ID=… npm run sandbox:clover`

## Field names to double-check in sandbox
Built from the REST reference; first sandbox run should confirm `atomic_order` field names (`orderCart.lineItems[].modifications`, `discounts[].amount`) and the payments body (`tender.id`, `amount`, `result`). The contract tests pin today's shapes so any correction is a one-line change.
