import { cloverAdapter } from "./adapters/clover";
import { lightspeedKAdapter, shift4Adapter, toastAdapter } from "./adapters/scaffold";
import { squareAdapter } from "./adapters/square";
import type { PosAdapter, PosProvider } from "./types";

export const POS_ADAPTERS: Record<PosProvider, PosAdapter> = {
  square: squareAdapter,
  clover: cloverAdapter,
  toast: toastAdapter,
  lightspeed_k: lightspeedKAdapter,
  shift4: shift4Adapter,
};

export const POS_LABELS: Record<PosProvider, string> = {
  square: "Square",
  clover: "Clover",
  toast: "Toast",
  lightspeed_k: "Lightspeed Restaurant (K-Series)",
  shift4: "Shift4 / SkyTab",
};

export function isPosProvider(p: string): p is PosProvider {
  return p in POS_ADAPTERS;
}

export function getAdapter(p: PosProvider): PosAdapter {
  return POS_ADAPTERS[p];
}
