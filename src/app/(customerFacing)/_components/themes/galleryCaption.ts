// Gallery alts are often upload filenames ("IMG_2034", "PXL_20240101…",
// "Gallery photo") — only show one as a caption when it reads like words.
export function niceCaption(alt?: string | null): string | null {
  const a = (alt ?? "").trim();
  if (!a || a.length > 28) return null;
  if (/^(img|dsc|dscn|pxl|photo|image|gallery photo|screenshot|whatsapp|snapchat|mvimg|download)\b/i.test(a)) return null;
  if (/[_]|\d{4,}|^[0-9a-f-]{8,}$/i.test(a)) return null;
  return a;
}
