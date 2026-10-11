import type { DeliveryProvider, DeliveryQuote, QuoteInput } from "./types";

// Pure routing logic: ask every enabled provider for a quote in parallel and
// pick one. A provider that errors or times out is simply skipped, so one
// courier being down never blocks delivery if the other can do it.

export type DeliveryStrategy = "cheapest" | "fastest" | "preferred";

/**
 * cheapest / fastest ETA / preferred-with-fallback. Only price, ETA and
 * availability are used — never driver distance or rating.
 */
export function pickQuote(
  quotes: DeliveryQuote[],
  strategy: DeliveryStrategy,
  preferred?: DeliveryQuote["provider"] | null,
): DeliveryQuote | null {
  if (!quotes.length) return null;
  if (strategy === "preferred") {
    const p = quotes.find((q) => q.provider === preferred);
    if (p) return p;
    strategy = "cheapest"; // preferred courier couldn't quote → cheapest of the rest
  }
  const eta = (q: DeliveryQuote) => q.etaMinutes ?? Number.POSITIVE_INFINITY;
  return [...quotes].sort((a, b) =>
    strategy === "fastest" ? eta(a) - eta(b) || a.feeCents - b.feeCents : a.feeCents - b.feeCents || eta(a) - eta(b),
  )[0];
}

export interface QuoteRound {
  chosen: DeliveryQuote | null;
  quotes: DeliveryQuote[];
  errors: { provider: string; message: string }[];
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timed out after ${ms}ms`)), ms))]);
}

export async function quoteAll(
  providers: DeliveryProvider[],
  input: QuoteInput,
  strategy: DeliveryStrategy,
  timeoutMs = 4_000,
  preferred?: DeliveryQuote["provider"] | null,
): Promise<QuoteRound> {
  const results = await Promise.allSettled(providers.map((p) => withTimeout(p.quote(input), timeoutMs)));
  const quotes: DeliveryQuote[] = [];
  const errors: QuoteRound["errors"] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") quotes.push(r.value);
    else errors.push({ provider: providers[i].id, message: (r.reason as Error)?.message ?? String(r.reason) });
  });
  return { chosen: pickQuote(quotes, strategy, preferred), quotes, errors };
}

/**
 * Dispatch with ONE failover: try the chosen courier; if that fails, quote the
 * next enabled courier and dispatch with it. Returns which courier took it, or
 * throws with every reason if none could.
 */
export async function dispatchWithFailover(
  primary: DeliveryProvider,
  others: DeliveryProvider[],
  input: import("./types").DispatchInput,
  quoteInput: QuoteInput,
  timeoutMs = 4_000,
): Promise<{ provider: DeliveryProvider; result: import("./types").DispatchResult; quote: DeliveryQuote; failedOver: boolean }> {
  const reasons: string[] = [];
  try {
    return { provider: primary, result: await primary.dispatch(input), quote: input.quote, failedOver: false };
  } catch (e) {
    reasons.push(`${primary.id}: ${(e as Error).message}`);
  }
  const next = others.find((p) => p.id !== primary.id);
  if (next) {
    try {
      const quote = await withTimeout(next.quote(quoteInput), timeoutMs);
      const result = await next.dispatch({ ...input, quote });
      return { provider: next, result, quote, failedOver: true };
    } catch (e) {
      reasons.push(`${next.id}: ${(e as Error).message}`);
    }
  }
  throw new Error(reasons.join(" | "));
}
