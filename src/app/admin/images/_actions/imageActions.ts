"use server";
import db from "@/db/db";
import { revalidatePath } from "next/cache";

// Same dev-local-fs / prod-Vercel-Blob pattern as src/app/admin/_actions/AddProduct.ts.
async function saveImage(file: File): Promise<string> {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const fs = await import("node:fs/promises");
    await fs.mkdir("public/site-images", { recursive: true });
    const path = `/site-images/${crypto.randomUUID()}-${file.name}`;
    await fs.writeFile(`public${path}`, new Uint8Array(await file.arrayBuffer()));
    return path;
  } else {
    const { put } = await import("@vercel/blob");
    const blob = await put(`site-images/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
    });
    return blob.url;
  }
}

export async function updateSiteImage(key: string, formData: FormData) {
  const file = formData.get("image") as File;
  if (!file || file.size === 0) return { error: "No file provided" };
  if (!file.type.startsWith("image/")) return { error: "Invalid image file" };

  try {
    const url = await saveImage(file);
    // upsert (not update) so a missing key can't throw a record-not-found error
    await db.siteImage.upsert({
      where: { key },
      update: { url },
      create: { key, url, label: key },
    });

    revalidatePath("/");
    revalidatePath("/story");
    revalidatePath("/admin/images");
    return { ok: true, url };
  } catch (error) {
    console.error("updateSiteImage error:", error);
    return {
      error:
        "Couldn't save the image. On the live site this usually means image storage (Vercel Blob) isn't connected yet.",
    };
  }
}
