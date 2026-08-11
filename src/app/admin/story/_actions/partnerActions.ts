"use server";
import { assertWritable } from "@/lib/previewGuard";

import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Shared image upload (dev: local fs, prod: Vercel Blob) ────────────────────
async function saveImage(file: File, folder = "partners"): Promise<string> {
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

// ── Shared schema ─────────────────────────────────────────────────────────────
const partnerSchema = z.object({
  name:   z.string().min(2),
  role:   z.string().min(2),
  accent: z.string().default("#c85a1e"),
  bio0:   z.string().min(10),
  bio1:   z.string().min(10),
  bio2:   z.string().min(10),
});

// ── UPDATE existing partner ───────────────────────────────────────────────────
export async function updatePartner(
  id: string,
  prevState: unknown,
  formData: FormData
) {
  await assertWritable();
  try {
    const raw = Object.fromEntries(formData.entries());
    const result = partnerSchema.safeParse(raw);
    if (!result.success) {
      return { error: result.error.issues[0]?.message ?? "Invalid data" };
    }

    const { name, role, accent, bio0, bio1, bio2 } = result.data;

    const existing = await db.partner.findUnique({ where: { id } });
    if (!existing) return { error: "Partner not found" };

    let image = existing.image;
    const file = formData.get("image") as File;
    if (file && file.size > 0 && file.type.startsWith("image/")) {
      image = await saveImage(file);
    }

    await db.partner.update({
      where: { id },
      data: { name, role, accent, image, bio: [bio0, bio1, bio2] },
    });

    revalidatePath("/admin/story");
    revalidatePath("/story");
    return { message: "Partner updated successfully" };
  } catch (error) {
    console.error(error);
    return { error: String(error) };
  }
}

// ── ADD new partner ───────────────────────────────────────────────────────────
export async function addPartner(prevState: unknown, formData: FormData) {
  await assertWritable();
  try {
    const raw = Object.fromEntries(formData.entries());
    const result = partnerSchema.safeParse(raw);
    if (!result.success) {
      return { error: result.error.issues[0]?.message ?? "Invalid data" };
    }

    const { name, role, accent, bio0, bio1, bio2 } = result.data;
    const order = parseInt(formData.get("order") as string) || 0;

    // Handle image - optional on create
    let image: string | null = null;
    const file = formData.get("image") as File;
    if (file && file.size > 0 && file.type.startsWith("image/")) {
      image = await saveImage(file);
    }

    await db.partner.create({
      data: {
        name,
        role,
        accent,
        image,
        bio: [bio0, bio1, bio2],
        order,
      },
    });

    revalidatePath("/admin/story");
    revalidatePath("/story");
    return { message: `${name} added successfully` };
  } catch (error) {
    console.error(error);
    return { error: String(error) };
  }
}

// ── DELETE partner ────────────────────────────────────────────────────────────
export async function deletePartner(id: string) {
  await assertWritable();
  try {
    await db.partner.delete({ where: { id } });
    revalidatePath("/admin/story");
    revalidatePath("/story");
  } catch (error) {
    console.error(error);
  }
}