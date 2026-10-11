# Toast — status: SCAFFOLD ONLY (not available)

Toast's standard API access is read-only; creating orders needs **Toast partner (integration) access** (docs/research/U4). `src/lib/pos/adapters/scaffold.ts` returns a clear "not available yet" error and the admin shows Toast as unavailable. Nothing is claimed in sales copy.

To build: apply at Toast's partner program → get Orders API credentials (client-credentials auth, restaurant GUID) → implement `pushOrder` with `POST /orders/v2/orders` and menu with `/menus/v2/menus`, mirroring the Square adapter + tests.

Until then, Toast restaurants can use the middleware route (docs/pos/middleware.md).

**BUILD ONLY AFTER A CLIENT HAS SIGNED AND PAID A DEPOSIT.**

## Access path
- Toast Partner Integrations program, OR "standard API access" created inside the restaurant's own Toast account by a staff member with **Manage Integrations** permission (needs Toast RMS Essentials or higher). Credentials are per location. Standard access is read-mostly; order creation needs partner access (docs/research/U4).

## What we need from the client
- Their Toast subscription level, and who on staff has Manage Integrations.
- If ordering writes need partner access: a realistic timeline (weeks to months for partner approval). Tell the client this before taking any money for it.

## Expected effort once access exists
About 3–5 days: auth (client credentials), menu pull (`/menus/v2`), order create (`/orders/v2/orders`), contract tests mirroring Square.
