# U3: Clover single-merchant access without an App Market listing

**Summary (read 2026-10-11):** PARTIALLY confirmed. Clover officially supports **private apps**: an app built for specific merchants, not public in the App Market, shared via a direct OAuth authorize link (`https://www.clover.com/oauth/authorize?client_id={APPID}`). The official docs say you still **submit it for approval** after creating it, and private apps cannot use App Market billing (pricing is discussed in the review). Community reports conflict on whether approval is really required and say review can take weeks. Development and testing against a **sandbox** developer merchant works without any approval. Conclusion: we can build and test the adapter fully in sandbox; connecting a real restaurant needs a private-app approval first. Plan for that lead time.

## Sources
- Private apps (official): https://docs.clover.com/docs/private-apps : "submit it for approval", "not publicly available in the Clover App Market", direct link `oauth/authorize?client_id={APPID}`, "Private apps are not billable using the App Market billing process."
- OAuth token docs: https://docs.clover.com/docs/obtaining-an-oauth-token
- Atomic orders (official): https://docs.clover.com/dev/docs/create-an-atomic-order : one call creates order with line items, modifiers, discounts, service charges. `POST /v3/merchants/{mId}/atomic_order/orders`. A checkout call `/atomic_order/checkouts` computes totals and tax without creating.
- Orders FAQ (official): https://docs.clover.com/dev/docs/orders-faqs : print with the Print API to the merchant's default device; formatting customization limited; `expand=item.tags` exposes kitchen/bar tags.
- Community (not official): modifier orders sometimes not printing; Clover staff once said private apps are not approved (conflicts with current docs, likely outdated).

## Not verified
- Exact print endpoint payload (believed `POST /v3/merchants/{mId}/print_event` with `{ "orderRef": { "id": "<orderId>" } }`): built behind `capabilities`, verified only by the sandbox script.
- How to record an externally paid tender (believed: create a payment with the merchant's "External payment" tender). Implemented as an optional step; if the tender is not found the order is left OPEN with a note "PAID ONLINE" so the kitchen still sees it.

## Design consequence
- Clover adapter is built and flag-gated. docs/pos/clover.md states clearly: "Real restaurants need Clover private-app approval (allow weeks). Sandbox works now."
