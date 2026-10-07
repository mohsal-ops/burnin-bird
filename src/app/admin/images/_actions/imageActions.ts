"use server";
import { removeStoredFile, storeFile } from "@/lib/storage";
import { assertWritable } from "@/lib/previewGuard";
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
    return storeFile("site-images", file); // R2 (or Blob fallback) — lib/storage.ts
  }
}

export async function updateSiteImage(key: string, formData: FormData) {
  await assertWritable();
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
    revalidatePath("/catering");
    revalidatePath("/admin/images");
    revalidatePath("/admin/media");
    return { ok: true, url };
  } catch (error) {
    console.error("updateSiteImage error:", error);
    return {
      error:
        `Couldn't save the image: ${(error as Error)?.message || "storage error"}. Try again in a minute.`,
    };
  }
}

// Point a slot at a built-in asset instead of an upload — used by the Smash &
// Bold mascot picker ("auto" = match the food type). Allow-listed so this can
// never be used to point a slot at an arbitrary URL.
const PRESET_URLS = new Set(["auto", "/mascots/box.webp", "/mascots/cup.webp", "/mascots/pizza.webp", "/mascots/bowl.webp"]);
export async function setSiteImagePreset(key: string, url: string) {
  await assertWritable();
  if (key !== "smash_mascot" || !PRESET_URLS.has(url)) return { error: "Not allowed" };
  try {
    await db.siteImage.upsert({ where: { key }, update: { url }, create: { key, url, label: "3D mascot" } });
    revalidatePath("/");
    revalidatePath("/admin/media");
    return { ok: true, url };
  } catch (error) {
    console.error("setSiteImagePreset error:", error);
    return { error: "Couldn't save. Try again." };
  }
}

// The design's signature words (sub-brand, hero word, stencil headline).
export async function updateThemeWords(values: Record<string, string>) {
  await assertWritable();
  const { THEME_WORD_KEYS } = await import("@/lib/themes/mediaSlots");
  try {
    await Promise.all(
      Object.entries(values)
        .filter(([k]) => THEME_WORD_KEYS.includes(k))
        .map(([k, v]) => {
          const value = String(v ?? "").slice(0, 40).trim();
          return db.siteSetting.upsert({ where: { key: k }, update: { value }, create: { key: k, value } });
        }),
    );
    revalidatePath("/");
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (error) {
    console.error("updateThemeWords error:", error);
    return { error: "Couldn't save. Try again." };
  }
}
