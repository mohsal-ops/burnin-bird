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

// Persistent limiter shared by every serverless instance (the in-memory one
// above resets per instance). One tiny table in this site's DB, created on
// first use. Returns true when ALLOWED. Fails open on a DB hiccup so a real
// customer is never blocked by our own outage.
let rlReady: Promise<unknown> | null = null;
export async function allowDb(key: string, limit: number, windowSec: number): Promise<boolean> {
  const { default: db } = await import("@/db/db");
  try {
    rlReady ??= (async () => {
      await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "RateHit" ("key" TEXT NOT NULL, "at" TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RateHit_key_at" ON "RateHit" ("key","at")`);
    })().catch(() => (rlReady = null));
    await rlReady;
    const rows = await db.$queryRawUnsafe<{ n: number }[]>(
      `SELECT count(*)::int AS n FROM "RateHit" WHERE "key" = $1 AND "at" > now() - ($2 || ' seconds')::interval`,
      key,
      String(windowSec),
    );
    if ((rows[0]?.n ?? 0) >= limit) return false;
    await db.$executeRawUnsafe(`INSERT INTO "RateHit" ("key") VALUES ($1)`, key);
    if (Math.random() < 0.02) await db.$executeRawUnsafe(`DELETE FROM "RateHit" WHERE "at" < now() - interval '2 days'`);
    return true;
  } catch {
    return true;
  }
}
