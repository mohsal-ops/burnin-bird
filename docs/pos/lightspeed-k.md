# Lightspeed Restaurant (K-Series) — status: SCAFFOLD ONLY

The K-Series order API (online ordering / "Order Anywhere" integrations) needs an approved Lightspeed partner app. Scaffold in `adapters/scaffold.ts`. To build: request API access via Lightspeed's partner portal → OAuth2 → implement `pushOrder` against the K-Series online-ordering endpoints and add contract tests. See docs/pos/middleware.md for the interim option.

**BUILD ONLY AFTER A CLIENT HAS SIGNED AND PAID A DEPOSIT.**

## Access path
The Lightspeed Restaurant K-Series developer portal is gated to approved partners (X-Series and R-Series are open with OAuth, but those are retail/older restaurant products).

## What we need from the client
Confirmation that they're on K-Series, their Lightspeed account rep's contact, and patience for partner approval.

## Expected effort once approved
About 3–5 days (OAuth2, menu pull, order injection, tests).
