import { objectKey, r2DeleteByUrl, r2Enabled, r2Put } from "./r2";

// One place every admin upload goes through. Cloudflare R2 when its env vars are
// set (the normal case), else Vercel Blob (older setups) — so a site keeps
// working whichever storage it has. Dev keeps writing to /public like before.

/** Save an uploaded file under `folder` and return its public URL. */
export async function storeFile(folder: string, file: File): Promise<string> {
  if (process.env.NODE_ENV === "development" && !r2Enabled()) {
    const fs = await import("node:fs/promises");
    await fs.mkdir(`public/${folder}`, { recursive: true });
    const path = `/${folder}/${crypto.randomUUID()}-${file.name}`;
    await fs.writeFile(`public${path}`, new Uint8Array(await file.arrayBuffer()));
    return path;
  }
  if (r2Enabled()) {
    return r2Put(objectKey(folder, file.name), Buffer.from(await file.arrayBuffer()), file.type || "application/octet-stream");
  }
  const { put } = await import("@vercel/blob");
  const blob = await put(`${folder}/${crypto.randomUUID()}-${file.name}`, file, { access: "public" });
  return blob.url;
}

/** Best-effort delete of a previously stored file (R2 or Blob). Never throws. */
export async function removeStoredFile(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith("https://")) return;
  try {
    if (process.env.R2_PUBLIC_URL && url.startsWith(process.env.R2_PUBLIC_URL)) return await r2DeleteByUrl(url);
    if (url.includes(".blob.vercel-storage.com")) {
      const { del } = await import("@vercel/blob");
      await del(url);
    }
  } catch {
    /* clearing the DB row is what matters */
  }
}
