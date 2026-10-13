// next/image loader. Vercel's own optimizer is OFF (its quota is account-wide and
// returned 402 for new sizes, so phones lost every photo).
//
// Owner-uploaded photos (Vercel Blob / R2 - often 2-3 MB PNGs) go through this
// site's own /api/img, which serves a small WebP at one of 5 fixed widths and is
// cached for a year on Vercel's CDN (instant after the first view). Local
// /public files are already web-sized and are served as-is.
import { snapWidth } from "./src/lib/imageWidths";

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!/^https?:\/\//.test(src)) return src;
  if (!/(\.public\.blob\.vercel-storage\.com|\.r2\.dev)\//i.test(src)) return src; // other hosts: as-is
  return `/api/img?u=${encodeURIComponent(src)}&w=${snapWidth(width)}`;
}
