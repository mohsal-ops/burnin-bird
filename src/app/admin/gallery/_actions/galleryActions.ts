"use server";
import { assertWritable } from "@/lib/previewGuard";

import db from "@/db/db";
import { revalidatePath } from "next/cache";

type ActionResult = { message?: string; error?: string };

// ── Image storage ────────────────────────────────────────────────────────────
// Same pattern as src/app/admin/_actions/products.ts - local fs in dev,
// Vercel Blob in production (filesystem is read-only on Vercel).
async function saveImage(file: File, folder = "gallery"): Promise<string> {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const fs = await import("node:fs/promises");
    await fs.mkdir(`public/${folder}`, { recursive: true });
    const path = `/${folder}/${crypto.randomUUID()}-${file.name}`;
    await fs.writeFile(`public${path}`, new Uint8Array(await file.arrayBuffer()));
    return path;
  } else {
    const { put } = await import("@vercel/blob");
    const blob = await put(
      `${folder}/${crypto.randomUUID()}-${file.name}`,
      file,
      { access: "public" }
    );
    return blob.url;
  }
}

async function deleteImageFile(url: string) {
  try {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev && url.startsWith("/")) {
      const fs = await import("node:fs/promises");
      await fs.unlink(`public${url}`);
    } else if (url.startsWith("https://")) {
      const { del } = await import("@vercel/blob");
      await del(url);
    }
  } catch (err) {
    console.warn("Gallery image file delete failed, skipping:", err);
  }
}

export async function addGalleryImage(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  await assertWritable();
  const files = formData
    .getAll("image")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const alt = String(formData.get("alt") ?? "").trim();

  if (files.length === 0) {
    return { error: "Please choose at least one image to upload." };
  }
  if (files.some((f) => !f.type.startsWith("image/"))) {
    return { error: "One or more of those files isn't an image." };
  }

  const maxOrder = await db.galleryImage.aggregate({ _max: { order: true } });
  let order = (maxOrder._max.order ?? -1) + 1;
  let added = 0;
  let failed = 0;

  // Upload each selected file and create a row per image.
  for (const file of files) {
    try {
      const url = await saveImage(file);
      await db.galleryImage.create({
        data: {
          url,
          // one shared alt applies to all; fall back to the filename per image
          alt: alt || file.name.replace(/\.[^.]+$/, ""),
          order: order++,
        },
      });
      added++;
    } catch (error) {
      console.error("addGalleryImage failed for", file.name, error);
      failed++;
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/gallery");

  if (added === 0) {
    return {
      error:
        "Couldn't upload. On the live site this usually means image storage (Vercel Blob) isn't connected yet.",
    };
  }
  if (failed > 0) {
    return {
      message: `${added} image${added !== 1 ? "s" : ""} added, ${failed} failed.`,
    };
  }
  return { message: added === 1 ? "Image added." : `${added} images added.` };
}

export async function deleteGalleryImage(id: string): Promise<ActionResult> {
  await assertWritable();
  const image = await db.galleryImage.findUnique({ where: { id } });
  if (!image) return { error: "Image not found." };

  await deleteImageFile(image.url);
  await db.galleryImage.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/admin/gallery");
  return { message: "Image deleted." };
}

export async function reorderGalleryImages(ids: string[]): Promise<ActionResult> {
  await assertWritable();
  await Promise.all(
    ids.map((id, index) =>
      db.galleryImage.update({ where: { id }, data: { order: index } })
    )
  );

  revalidatePath("/");
  revalidatePath("/admin/gallery");
  return { message: "Order updated." };
}
