import { PosError, type PosAdapter, type PosProvider } from "../types";

// Scaffolds for POSes whose order-write APIs are partner-gated. They exist so
// the admin can show them honestly ("not available yet — needs partner
// access") and so the real adapter has a typed slot to fill. Every method
// throws a non-retryable PosError; nothing here ever talks to the network.
// What each one needs is in docs/pos/<provider>.md.

function scaffold(provider: PosProvider, blocker: string): PosAdapter {
  const fail = async (): Promise<never> => {
    throw new PosError(`${provider} is not available yet: ${blocker}`, false);
  };
  return {
    provider,
    support: "scaffold",
    authorizeUrl() {
      throw new PosError(`${provider} is not available yet: ${blocker}`, false);
    },
    exchangeCode: fail,
    listLocations: fail,
    importMenu: fail,
    pushOrder: fail,
  };
}

export const toastAdapter = scaffold("toast", "Toast order creation requires Toast partner (integration) access.");
export const lightspeedKAdapter = scaffold(
  "lightspeed_k",
  "Lightspeed K-Series order API requires an approved Lightspeed partner app.",
);
export const shift4Adapter = scaffold("shift4", "Shift4 (SkyTab) ordering API requires Shift4 marketplace partnership.");
