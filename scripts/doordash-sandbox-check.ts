/**
 * DoorDash Drive SANDBOX check. Use SANDBOX credentials from the Developer
 * Portal (developer.doordash.com → Credentials → Sandbox). Sandbox deliveries
 * are simulated; nothing is charged.
 *
 *   DOORDASH_DEVELOPER_ID=… DOORDASH_KEY_ID=… DOORDASH_SIGNING_SECRET=… npm run sandbox:doordash
 *
 * Steps: quote a delivery between two public addresses → accept it → print
 * the tracking URL. Pass ACCEPT=0 to stop after the quote.
 */
import { createDoorDashProvider } from "../src/lib/delivery/doordash";

async function main() {
  const e = process.env;
  if (!e.DOORDASH_DEVELOPER_ID || !e.DOORDASH_KEY_ID || !e.DOORDASH_SIGNING_SECRET) {
    console.error("Set DOORDASH_DEVELOPER_ID, DOORDASH_KEY_ID, DOORDASH_SIGNING_SECRET (SANDBOX key).");
    process.exit(1);
  }
  const dd = createDoorDashProvider(async () => ({
    developerId: e.DOORDASH_DEVELOPER_ID!.trim(),
    keyId: e.DOORDASH_KEY_ID!.trim(),
    signingSecret: e.DOORDASH_SIGNING_SECRET!.trim(),
  }));
  const externalId = `sv-sandbox-${Date.now()}`;
  const pickup = { formatted: "901 Market Street 6th Floor San Francisco, CA 94103", businessName: "Starvega Sandbox", phone: "+16505555555" };
  const dropoff = { formatted: "901 Folsom Street San Francisco, CA 94107", name: "Sandbox Test", phone: "+16505555555" };

  const q = await dd.quote({ externalId, pickup, dropoff, orderValueCents: 2500 });
  console.log(`✓ quote ${q.ref}: $${(q.feeCents / 100).toFixed(2)}, ETA ${q.etaMinutes ?? "?"} min`);
  if (e.ACCEPT === "0") return;

  const d = await dd.dispatch({ quote: q, externalId, pickup, dropoff, items: [{ name: "Test", quantity: 1 }], orderValueCents: 2500, siteUrl: "https://example.test" });
  console.log(`✓ accepted: ${d.deliveryId} status=${d.status} tracking=${d.trackingUrl ?? "-"}`);
}

main().catch((err) => {
  console.error("✗", (err as Error).message);
  process.exit(1);
});
