// Best-effort in-memory sliding-window rate limiter. Good enough for a
// single-instance deployment; if this app scales to multiple serverless
// instances, swap this for a shared store (e.g. Upstash Redis).
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  // Prevent unbounded growth from many distinct keys.
  if (hits.size > 10_000) {
    const oldestKey = hits.keys().next().value;
    if (oldestKey) hits.delete(oldestKey);
  }

  return false;
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
