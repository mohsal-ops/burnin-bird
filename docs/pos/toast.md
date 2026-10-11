# Toast — status: SCAFFOLD ONLY (not available)

Toast's standard API access is read-only; creating orders needs **Toast partner (integration) access** (docs/research/U4). `src/lib/pos/adapters/scaffold.ts` returns a clear "not available yet" error and the admin shows Toast as unavailable. Nothing is claimed in sales copy.

To build: apply at Toast's partner program → get Orders API credentials (client-credentials auth, restaurant GUID) → implement `pushOrder` with `POST /orders/v2/orders` and menu with `/menus/v2/menus`, mirroring the Square adapter + tests.

Until then, Toast restaurants can use the middleware route (docs/pos/middleware.md).
