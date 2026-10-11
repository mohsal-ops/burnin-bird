import { timingSafeEqual } from "node:crypto";

// Shared-secret check for endpoints an external scheduler (n8n) calls, e.g.
// /api/pos/retry. Key comes as ?key= or the x-starvega-key header and must
// equal STARVEGA_JOBS_SECRET. No secret configured → always refused.
export function isJobRequest(req: Request): boolean {
  const secret = process.env.STARVEGA_JOBS_SECRET?.trim();
  if (!secret) return false;
  const got = req.headers.get("x-starvega-key") ?? new URL(req.url).searchParams.get("key") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
