# Lightspeed Restaurant (K-Series) — status: SCAFFOLD ONLY

The K-Series order API (online ordering / "Order Anywhere" integrations) needs an approved Lightspeed partner app. Scaffold in `adapters/scaffold.ts`. To build: request API access via Lightspeed's partner portal → OAuth2 → implement `pushOrder` against the K-Series online-ordering endpoints and add contract tests. See docs/pos/middleware.md for the interim option.
