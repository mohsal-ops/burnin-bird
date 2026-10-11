/**
 * Clover SANDBOX end-to-end check. Environment is hard-coded to "sandbox"
 * (apisandbox.dev.clover.com); no real money moves.
 *
 *   CLOVER_SANDBOX_TOKEN=... CLOVER_SANDBOX_MERCHANT_ID=... npm run sandbox:clover
 *
 * Get both from sandbox.dev.clover.com → your test merchant → Setup → API
 * Tokens (needs Orders write + Inventory read + Payments write). The merchant id
 * is in the dashboard URL.
 * Steps: read merchant → import items → push one $1.00 test order (atomic order
 * → external payment → print) → retry with the same order id to prove no duplicates.
 */
import { cloverAdapter } from "../src/lib/pos/adapters/clover";
import type { PosContext, PosOrderInput } from "../src/lib/pos/types";

async function main() {
  const accessToken = process.env.CLOVER_SANDBOX_TOKEN?.trim();
  const merchantId = process.env.CLOVER_SANDBOX_MERCHANT_ID?.trim();
  if (!accessToken || !merchantId) {
    console.error("Set CLOVER_SANDBOX_TOKEN and CLOVER_SANDBOX_MERCHANT_ID (SANDBOX values).");
    process.exit(1);
  }
  const ctx: PosContext = { environment: "sandbox", merchantId, creds: { accessToken } };

  const [m] = await cloverAdapter.listLocations(ctx);
  console.log(`✓ merchant: ${m.name}`);
  const menu = await cloverAdapter.importMenu(ctx);
  console.log(`✓ items: ${menu.items.length}`);

  const order: PosOrderInput = {
    externalId: `sbx-${Date.now()}`,
    lines: [{ name: "Sandbox test item", quantity: 1, unitPriceCents: 100, modifiers: [] }],
    customer: { name: "Sandbox Test" },
    fulfillment: { type: "pickup", timezone: "America/New_York", note: "Starvega sandbox check — ignore" },
    discountCents: 0,
    deliveryFeeCents: 0,
    tipCents: 0,
    totalCents: 100,
  };
  let created = "";
  const r = await cloverAdapter.pushOrder(ctx, order, { onCreated: async (id) => void (created = id) });
  console.log(`✓ order created ${created}, paid + print event sent (total ${r.posTotalCents}¢)`);

  const again = await cloverAdapter.pushOrder(ctx, order, { existingPosOrderId: created });
  console.log(again.posOrderId === created ? "✓ retry reused the order, no second payment" : "✗ retry mismatch");
}

main().catch((e) => {
  console.error("✗", (e as Error).message);
  process.exit(1);
});
