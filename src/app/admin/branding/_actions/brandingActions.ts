"use server";
import { assertWritable } from "@/lib/previewGuard";

import db from "@/db/db";
import { revalidatePath } from "next/cache";

// Same dev-fs / prod-Vercel-Blob pattern as the other image actions.
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
    const blob = await put(
      `site-images/${crypto.randomUUID()}-${file.name}`,
      file,
      { access: "public" },
    );
    return blob.url;
  }
}

export async function updateThemeColor(color: string) {
  await assertWritable();
  if (!/^#[0-9a-fA-F]{3,8}$/.test(color)) {
    return { error: "Please choose a valid color." };
  }
  try {
    await db.siteSetting.upsert({
      where: { key: "theme_color" },
      update: { value: color },
      create: { key: "theme_color", value: color },
    });
    // revalidate the whole layout so the new color reaches every page
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("updateThemeColor error:", error);
    return { error: "Couldn't save the color. Try again." };
  }
}

export async function updateLogo(formData: FormData) {
  await assertWritable();
  const file = formData.get("logo") as File;
  if (!file || file.size === 0) return { error: "No file provided" };
  if (!file.type.startsWith("image/")) return { error: "Invalid image file" };
  try {
    const url = await saveImage(file);
    await db.siteSetting.upsert({
      where: { key: "logo_url" },
      update: { value: url },
      create: { key: "logo_url", value: url },
    });
    revalidatePath("/", "layout");
    return { ok: true, url };
  } catch (error) {
    console.error("updateLogo error:", error);
    return {
      error:
        "Couldn't save the logo. On the live site this usually means image storage (Vercel Blob) isn't connected yet.",
    };
  }
}

export async function updateHomeText(headline: string, subheadline: string) {
  await assertWritable();
  try {
    await Promise.all([
      db.siteSetting.upsert({
        where: { key: "home_headline" },
        update: { value: headline },
        create: { key: "home_headline", value: headline },
      }),
      db.siteSetting.upsert({
        where: { key: "home_subheadline" },
        update: { value: subheadline },
        create: { key: "home_subheadline", value: subheadline },
      }),
    ]);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("updateHomeText error:", error);
    return { error: "Couldn't save the text. Try again." };
  }
}
