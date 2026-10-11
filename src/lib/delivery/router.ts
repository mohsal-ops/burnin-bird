import type { DeliveryProvider, DeliveryQuote, QuoteInput } from "./types";

// Pure routing logic: ask every enabled provider for a quote in parallel and
// pick one. A provider that errors or times out is simply skipped, so one
// courier being down never blocks delivery if the other can do it.

export type DeliveryStrategy = "cheapest" | "fastest";

export function pickQuote(quotes: DeliveryQuote[], strategy: DeliveryStrategy): DeliveryQuote | null {
  if (!quotes.length) return null;
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
  timeoutMs = 8_000,
): Promise<QuoteRound> {
  const results = await Promise.allSettled(providers.map((p) => withTimeout(p.quote(input), timeoutMs)));
  const quotes: DeliveryQuote[] = [];
  const errors: QuoteRound["errors"] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") quotes.push(r.value);
    else errors.push({ provider: providers[i].id, message: (r.reason as Error)?.message ?? String(r.reason) });
  });
  return { chosen: pickQuote(quotes, strategy), quotes, errors };
}
