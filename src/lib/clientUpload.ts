"use client";

// Browser-side photo upload: shrink big photos first (phones shoot 4-12 MB; the
// site never shows more than ~2400px), then PUT straight to Cloudflare R2 with a
// presigned URL from /api/storage/presign. Returns the public URL, or null when
// R2 isn't configured on this site (caller falls back to its old upload path).

export async function shrinkPhoto(file: File, maxSide = 2400): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 900_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

export async function uploadPhotoDirect(input: File, folder: "gallery" | "site-images" | "products" | "partners"): Promise<string | null> {
  const file = await shrinkPhoto(input);
  const res = await fetch("/api/storage/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, filename: file.name, contentType: file.type }),
  });
  if (res.status === 501) return null;
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.uploadUrl) throw new Error(j.error || `Upload not allowed (${res.status})`);
  const put = await fetch(j.uploadUrl, { method: "PUT", body: file });
  if (!put.ok) throw new Error(`Storage upload failed (${put.status})`);
  return j.publicUrl as string;
}
