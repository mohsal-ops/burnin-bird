# 08 - Business docs

Branch: `docs/business` (from `main`; docs only). The care plan is on `feat/spec-gaps` at `docs/business/care-plan.md`.

## Written
- `service-agreement-template.md`: batches, 50% deposit, no next batch until paid, unpaid work stays on our hosting, ownership, client owns domain/DNS and data, third-party costs in the client's name, support, termination + offboarding, liability cap. Starts with a not-legal-advice / lawyer-review note.
- `sow-feature-batch-template.md`, `invoice-template.md`
- `offboarding-checklist.md`: data export incl. loyalty consent records, domain, key rotation (Stripe/POS/couriers/Brevo/app stores), hosting, close-out.
- `client-intake-checklist.md`: POS, admin rights, who can create API credentials, domain owner, who answers support.
- `pos-readiness-checklist.md`: product line, who must approve a third party, honest timelines, SOW wording.
- `sales/pos-qualification.md`: one question, then what to say and not say per POS.

## Verified
Docs only. The POS statuses match the code: Square/Clover built but not live; Toast/Lightspeed/Shift4 scaffold only.

## NEEDS MOHSAL
1. Have a US lawyer review the service agreement (governing law matters since you are outside the US).
2. Fill in the bracketed blanks (rates, hosting terms, launch-support days).
