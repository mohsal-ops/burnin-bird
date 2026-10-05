// next/image loader. Vercel's own optimizer is OFF (its quota is account-wide and
// returned 402 for new sizes, so phones lost every photo). Remote images (owner
// uploads on Vercel Blob — often 2-3 MB PNGs) are resized + converted to WebP by
// wsrv.nl, a free, cached image CDN, so a phone gets ~50 KB instead of 3 MB.
// Local /public files are already web-sized and are served as-is.
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (!/^https?:\/\//.test(src)) return src;
  return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}&output=webp`;
}
