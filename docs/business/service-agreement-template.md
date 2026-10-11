# Website & Online Ordering Service Agreement (TEMPLATE)

> **Template only. Not legal advice.** Written by a developer, not a lawyer. Have a US-licensed lawyer review it before using it with a client, especially the liability, payment and governing-law sections. State laws differ.

**Between:** [Starvega / Mohsal Ben, address] ("Developer")
**And:** [Restaurant legal name, address, EIN optional] ("Client")
**Date:** [date] **Project:** [restaurant name] website and online ordering

---

## 1. What we're building (scope)
1.1 The Developer will build and launch the items listed in the attached **Statement of Work (SOW)** for each **feature batch** (for example: Batch 1 = website + pickup ordering; Batch 2 = delivery; Batch 3 = POS connection).
1.2 Anything not written in an SOW is out of scope. New requests get a new SOW with its own price.
1.3 Each SOW lists **acceptance criteria**. A batch is accepted when the Client confirms in writing (email or message is fine) or **5 business days** after delivery with no written list of problems, whichever is first. Small fixes found after acceptance are handled under support (section 8).

## 2. Price and payment
2.1 **Deposit:** 50% of each batch's price is due before work on that batch starts. The deposit is non-refundable once work has started.
2.2 **Balance:** the other 50% is due on acceptance of that batch, **before the next batch starts**.
2.3 **No next batch until the last one is paid.** The Developer will not start a new batch while any invoice is unpaid.
2.4 Invoices are due within **7 days**. Payment by [PayPal / bank transfer / Stripe link].
2.5 Prices are in US dollars and do not include third-party costs (section 6).

## 3. If an invoice isn't paid
3.1 Work that hasn't been fully paid for **stays on the Developer's hosting and accounts**. It is not transferred to the Client until paid in full.
3.2 After **14 days** overdue, the Developer may pause unpaid features (for example, turn off a feature batch that hasn't been paid for) after giving **5 days' written notice**. Paid features keep working.
3.3 The Developer will never delete the Client's order or customer data because of late payment. The Client can always request an export of their own data (section 9).

## 4. Who owns what
4.1 **Client owns:** their brand, logo, photos, menu, text, domain name, and all their order and customer data.
4.2 **On full payment of a batch,** the Client receives a perpetual, non-exclusive licence to use the delivered website and features for their restaurant(s). [Optional, if you agree: or full ownership of the custom code written only for the Client.]
4.3 **Developer keeps:** the underlying platform, templates, tools and reusable code used across many clients. The Client can't resell or relicense them. This is what keeps the price low.
4.4 Third-party software and services (Stripe, Square, Uber, etc.) are owned by those companies and used under their own terms.

## 5. Domain and DNS
5.1 The **Client owns the domain** and keeps it registered in the Client's own name and account.
5.2 The Client gives the Developer the DNS access needed for setup, and may remove it at any time after launch.
5.3 If the Developer registers a domain for the Client, it is registered in the Client's name, and login details are handed over on full payment.

## 6. Hosting and third-party costs
6.1 Third-party services are paid by the Client directly to those companies, for example:
- card processing fees (Stripe or the Client's POS processor)
- courier fees (Uber Direct, DoorDash Drive)
- SMS/email sending (e.g. Brevo)
- POS subscriptions
- domain renewal
- app store accounts (Apple $99/year, Google $25 one-time)
6.2 Each third-party account (Stripe, POS, courier, app store) is opened **in the Client's own name**. The Client is the merchant of record.
6.3 Hosting: [included for X months / billed at $X per month / covered by the care plan]. State which.

## 7. Client's responsibilities
- Provide content (menu, prices, photos, hours) and approvals on time. Delays on the Client's side move the schedule.
- Keep their third-party accounts in good standing (e.g. a Stripe account restricted by Stripe is outside the Developer's control).
- Check orders and prices on the live site after launch and report problems promptly.
- Make sure their menu, prices, allergen info and promotions are accurate and legal.

## 8. Support
8.1 **Launch support:** bug fixes for [30] days after each batch is accepted, at no charge.
8.2 **After that:** support is covered by an optional monthly care plan (see `care-plan.md`), or billed at $[X]/hour.
8.3 Support hours and response times: Monday–Saturday, 8am–5pm US Eastern. The Developer works from Algeria (UTC+1). Urgent "orders are stopped" problems get a first reply within 2 hours inside those hours.

## 9. Ending the agreement (termination and offboarding)
9.1 Either party can end this agreement with **30 days' written notice**.
9.2 On ending, once all invoices are paid, the Developer will:
- export the Client's data (orders, customers, menu) in a standard format (CSV/JSON)
- hand over or help move domain/DNS settings
- help the Client **rotate keys**: Stripe, POS, courier, SMS. Disconnect them from the Developer's systems and remove the Developer's access.
- transfer or shut down hosting, as agreed
9.3 See `offboarding-checklist.md`. Offboarding work beyond [2] hours is billed at the hourly rate.

## 10. Limitation of liability
10.1 The Developer is not liable for lost profits, lost orders, or indirect damages, including outages of third-party services (payment processors, POS, couriers, hosting providers).
10.2 The Developer's total liability under this agreement is limited to the amount the Client paid in the **3 months** before the claim.
10.3 Nothing in this section limits liability that can't be limited by law.

## 11. Confidentiality and data
Each party keeps the other's private information confidential. The Developer only uses the Client's customer data to run the Client's site, never sells it, and follows the consent rules for marketing texts and emails (TCPA / CAN-SPAM) built into the loyalty system.

## 12. General
- **Independent contractor.** The Developer is not an employee.
- **Whole agreement.** This agreement and its SOWs are the full agreement. Changes must be in writing.
- **Governing law:** [State], USA. *(Lawyer to confirm, given the Developer is outside the US.)*
- **Signatures:** electronic signatures are fine.

| Developer | Client |
|---|---|
| Name: | Name: |
| Signature: | Signature: |
| Date: | Date: |
