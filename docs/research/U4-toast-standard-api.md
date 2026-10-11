# U4: Toast standard API access and order creation

**Summary (read 2026-10-11):** CONFIRMED. Toast "standard API access" is **read-only**. Its own guide says: "Write access. Your integration can only read data from Toast." The scope list contains only `:read` scopes (orders:read, menus:read, stock:read, config:read …). Submitting an order needs `orders.orders:write`, which is only available to **partner integrations and custom integrations**. So online orders into Toast require a Toast partner agreement (or a custom integration Toast grants). We do NOT build Toast ordering now.

## Sources
- Standard API access overview: https://doc.toasttab.com/doc/devguide/devApiAccessUserGuide.html : "Write access. Your integration can only read data from Toast." "All API requests are location-specific."
- Standard API access scopes: https://doc.toasttab.com/doc/devguide/devApiAccessScopes.html (read scopes only)
- Submitting your first order: https://doc.toasttab.com/doc/devguide/apiOrdersFirstOrder.html : requires `orders.orders:write` and `config:read`.
- API overview: https://doc.toasttab.com/doc/devguide/apiOverview.html : POST/PUT/PATCH/DELETE listed for partner and custom integrations only.

## Not verified
- Who in a restaurant can create standard credentials and which subscription tier (the prompt says Manage Integrations + RMS Essentials). The pages I read did not state the tier. Irrelevant for ordering since it is read-only.

## What standard (read-only) access could still give us
- Menu read (menus:read) and stock read (stock:read) → we COULD sync menu + 86'd items from Toast into the site without a partner deal. Orders would still go to the kitchen by our existing path (email/Telegram/admin). Recorded as a possible "Toast menu-sync only" feature in docs/pos/toast.md. Not built.
