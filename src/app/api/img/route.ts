import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { r2Enabled, r2Put, r2PublicUrl } from "@/lib/r2";
import { IMG_WIDTHS } from "@/lib/imageWidths";

// Fast photos: GET /api/img?u=<original url>&w=<width>
//
// Returns a small WebP of an owner-uploaded photo at one of a few fixed widths.
// The response is cached for a year by Vercel's CDN, so after the first request
// in a region it is served from the edge with no function run, no CPU and no
// third-party proxy (the old wsrv.nl proxy took 2-11 s on a cold photo).
// Each resized copy is also saved in R2 (_v/<hash>/<w>.webp), so a cache miss
// elsewhere is just a quick fetch, not a new resize. Only our own storage hosts
// are accepted, so this can't be used as an open image proxy.
export const runtime = "nodejs";

const ALLOWED = /^https:\/\/([a-z0-9-]+\.public\.blob\.vercel-storage\.com|pub-[a-z0-9]+\.r2\.dev)\//i;
const MAX_SOURCE = 25 * 1024 * 1024;
const YEAR = "public, max-age=31536000, s-maxage=31536000, immutable";
// Vercel's edge keeps its own copy only with an explicit CDN header.
const CACHED = { "Content-Type": "image/webp", "Cache-Control": YEAR, "CDN-Cache-Control": "max-age=31536000", "Vercel-CDN-Cache-Control": "max-age=31536000" };

function bad(status: number) {
  return new Response(null, { status, headers: { "Cache-Control": "public, max-age=60" } });
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("u") || "";
  const w = Number(req.nextUrl.searchParams.get("w"));
  if (!ALLOWED.test(src) || !IMG_WIDTHS.includes(w)) return bad(400);

  const key = `_v/q72/${crypto.createHash("sha1").update(src).digest("hex")}/${w}.webp`;

  // 1) Already made? Serve the stored copy.
  if (r2Enabled()) {
    try {
      const hit = await fetch(r2PublicUrl(key), { signal: AbortSignal.timeout(8000) });
      if (hit.ok) {
        return new Response(hit.body, { headers: CACHED });
      }
    } catch {
      /* make it below */
    }
  }

  // 2) Make it: fetch the original once, resize, convert to WebP.
  let input: Buffer;
  try {
    const r = await fetch(src, { signal: AbortSignal.timeout(20000), redirect: "error" });
    if (!r.ok) return bad(404);
    if (Number(r.headers.get("content-length") || 0) > MAX_SOURCE) return bad(413);
    input = Buffer.from(await r.arrayBuffer());
    if (input.length > MAX_SOURCE) return bad(413);
  } catch {
    return bad(502);
  }

  let out: Buffer;
  try {
    const sharp = (await import("sharp")).default;
    out = await sharp(input, { failOn: "none" })
      .rotate() // respect phone EXIF orientation
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 72, alphaQuality: 80, effort: 4 }) // keeps transparency (cut-out dish photos); ~100 KB at 640 px
      .toBuffer();
  } catch {
    // Not something sharp can read: hand back the original rather than a broken image.
    return new Response(new Uint8Array(input), { headers: { "Cache-Control": "public, max-age=3600" } });
  }

  if (r2Enabled()) {
    await r2Put(key, out, "image/webp").catch(() => {}); // best-effort; the CDN still caches the response
  }
  return new Response(new Uint8Array(out), { headers: CACHED });
}
