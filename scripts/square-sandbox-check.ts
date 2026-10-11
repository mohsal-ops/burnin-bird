/**
 * Square SANDBOX end-to-end check. Never touches production: the environment is
 * hard-coded to "sandbox" (connect.squareupsandbox.com), where no real money moves.
 *
 *   SQUARE_SANDBOX_ACCESS_TOKEN=EAAA... npm run sandbox:square
 *
 * Token: developer.squareup.com → your app → Sandbox → "Sandbox Access token".
 * Steps: list locations → import the catalog → push one $1.00 test order
 * (CreateOrder → EXTERNAL payment → PayOrder) → print the Square order id so
 * you can see it in the Sandbox Seller Dashboard → Orders.
 */
import { squareAdapter } from "../src/lib/pos/adapters/square";
import type { PosContext } from "../src/lib/pos/types";

async function main() {
  const accessToken = process.env.SQUARE_SANDBOX_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    console.error("Set SQUARE_SANDBOX_ACCESS_TOKEN (a SANDBOX token).");
    process.exit(1);
  }
  const ctx: PosContext = { environment: "sandbox", creds: { accessToken } };

  const locations = await squareAdapter.listLocations(ctx);
  console.log(`✓ locations: ${locations.map((l) => l.name).join(", ") || "(none)"}`);
  if (!locations.length) throw new Error("Sandbox account has no active location");
  ctx.locationId = process.env.SQUARE_SANDBOX_LOCATION_ID || locations[0].id;

  const menu = await squareAdapter.importMenu(ctx);
  console.log(`✓ catalog: ${menu.items.length} sellable items`);

  const ref = `sandbox-check-${Date.now()}`;
  const r = await squareAdapter.pushOrder(ctx, {
    externalId: ref,
    lines: [{ name: "Sandbox test item", quantity: 1, unitPriceCents: 100, modifiers: [] }],
    customer: { name: "Sandbox Test" },
    fulfillment: { type: "pickup", timezone: "America/New_York", note: "Starvega sandbox check — ignore" },
    discountCents: 0,
    deliveryFeeCents: 0,
    tipCents: 0,
    totalCents: 100,
  });
  console.log(`✓ order pushed + paid (EXTERNAL): ${r.posOrderId}, Square total ${r.posTotalCents}¢`);

  // Same reference again must NOT create a second order (idempotency keys).
  const again = await squareAdapter.pushOrder(ctx, {
    externalId: ref,
    lines: [{ name: "Sandbox test item", quantity: 1, unitPriceCents: 100, modifiers: [] }],
    customer: { name: "Sandbox Test" },
    fulfillment: { type: "pickup", timezone: "America/New_York" },
    discountCents: 0,
    deliveryFeeCents: 0,
    tipCents: 0,
    totalCents: 100,
  });
  console.log(again.posOrderId === r.posOrderId ? "✓ retry is idempotent (same order id)" : `✗ retry made a NEW order ${again.posOrderId}`);
}

main().catch((e) => {
  console.error("✗", (e as Error).message);
  process.exit(1);
});
