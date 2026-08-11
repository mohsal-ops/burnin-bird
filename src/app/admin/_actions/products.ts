"use server";
import { assertWritable } from "@/lib/previewGuard";

import { z } from "zod";
import db from "@/db/db";
import { notFound } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";

// ── Image storage ────────────────────────────────────────────────────────────
// On Vercel, the filesystem is READ-ONLY - fs.writeFile will silently fail.
// We use Vercel Blob (free tier: 1GB) in production, and local fs in dev.
// Setup: run `npm install @vercel/blob` then add BLOB_READ_WRITE_TOKEN to
// your Vercel project settings (Storage → Blob → Connect → copy token).

async function saveImage(file: File, folder = "products"): Promise<string> {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // Local dev - write to public folder as before
    const fs = await import("node:fs/promises");
    await fs.mkdir(`public/${folder}`, { recursive: true });
    const path = `/${folder}/${crypto.randomUUID()}-${file.name}`;
    await fs.writeFile(`public${path}`, new Uint8Array(await file.arrayBuffer()));
    return path;
  } else {
    // Production (Vercel) - upload to Vercel Blob
    const { put } = await import("@vercel/blob");
    const blob = await put(
      `${folder}/${crypto.randomUUID()}-${file.name}`,
      file,
      { access: "public" }
    );
    return blob.url; // full https:// URL
  }
}

async function deleteImage(imagePath: string) {
  try {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev && imagePath.startsWith("/")) {
      const fs = await import("node:fs/promises");
      await fs.unlink(`public${imagePath}`);
    } else if (imagePath.startsWith("https://")) {
      const { del } = await import("@vercel/blob");
      await del(imagePath);
    }
  } catch (err) {
    console.warn("Image delete failed, skipping:", err);
  }
}

// ── Schemas ──────────────────────────────────────────────────────────────────
const imageSchema = z
  .instanceof(File)
  .optional()
  .refine(
    (file) => !file || file.size === 0 || file.type.startsWith("image/"),
    { message: "Invalid image file" }
  );

const addSchema = z.object({
  name: z.string().min(2),
  description: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.union([z.string().min(2), z.undefined()])
  ),
  price: z.coerce.number().positive({ message: "Enter a price greater than 0" }),
  category: z
    .string()
    .min(1)
    .refine((val) => !val.startsWith("[object]"), {
      message: "Invalid category format",
    }),
  isCaterable: z.preprocess((val) => val === "true", z.boolean()).optional(),
  cateringDescription: z
    .preprocess((val) => (val === "" ? undefined : val), z.string())
    .optional(),
  cateringPrice: z.coerce.number().optional(),
  image: imageSchema.optional(),
});

const editSchema = addSchema.extend({
  image: imageSchema.optional(),
});

// ── Add product ──────────────────────────────────────────────────────────────
export default async function AddProduct(
  prevState: unknown,
  formData: FormData
) {
  await assertWritable();
  try {
    const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      const first = result.error.issues[0];
      const field = first?.path?.join(".");
      return { message: `${field ? field + ": " : ""}${first?.message ?? "Invalid input"}` };
    }

    const { data } = result;

    // Build a UNIQUE slug so items with the same/similar name still save
    // (append -2, -3, … instead of rejecting the duplicate).
    const base =
      data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
    let slug = base;
    let n = 1;
    while (await db.item.findUnique({ where: { slug } })) slug = `${base}-${++n}`;

    // Handle image — never let a storage hiccup block saving the item.
    const file = data.image;
    const isValidImage = file && file.size > 0 && file.type.startsWith("image/");
    let image: string | null = null;
    let imageWarning = false;
    if (isValidImage) {
      try {
        image = await saveImage(file);
      } catch (e) {
        console.error("Image save failed:", e);
        imageWarning = true;
      }
    }

    await db.item.create({
      data: {
        name: data.name,
        description: data.description,
        priceInCents: Math.round(data.price * 100),
        slug,
        typeId: data.category,
        isCaterable: data.isCaterable,
        cateringDescription: data.cateringDescription,
        cateringPriceInCents: data.cateringPrice ? Math.round(data.cateringPrice * 100) : null,
        image,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/menuItems");
    revalidatePath("/Menu");
    revalidateTag("products");
    return {
      message: imageWarning
        ? "Item added — but the photo couldn't be saved (image storage isn't connected on this site)."
        : "Menu item added.",
    };
  } catch (error) {
    console.error("AddProduct error:", error);
    return { message: String(error) };
  }
}

// ── Update product ───────────────────────────────────────────────────────────
export async function updateProduct(
  id: string,
  prevState: unknown,
  formData: FormData
) {
  await assertWritable();
  const result = editSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    const first = result.error.issues[0];
    const field = first?.path?.join(".");
    return { message: `${field ? field + ": " : ""}${first?.message ?? "Invalid input"}` };
  }

  const { data } = result;
  const item = await db.item.findUnique({ where: { id } });
  if (!item) return notFound();

  let image = item.image;
  const file = data.image;
  const isValidImage = file && file.size > 0 && file.type.startsWith("image/");

  if (isValidImage) {
    try {
      if (item.image) await deleteImage(item.image);
      image = await saveImage(file);
    } catch (e) {
      console.error("Image save failed:", e);
    }
  }

  await db.item.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      priceInCents: Math.round(data.price * 100),
      isCaterable: data.isCaterable,
      cateringDescription: data.cateringDescription,
      cateringPriceInCents: data.cateringPrice ? Math.round(data.cateringPrice * 100) : null,
      image,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/menuItems");
  revalidatePath("/Menu");
  revalidateTag("products");
  return { message: "item updated successfully" };
}

// ── Category actions ─────────────────────────────────────────────────────────
const categorySchema = z.object({ name: z.string().min(1) });

export async function AddCategory(prevState: unknown, formData: FormData) {
  await assertWritable();
  try {
    const result = categorySchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) return { message: "Please enter a category name." };

    function createSlug(str: string) {
      return str.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    }

    const slug = createSlug(result.data.name);
    await db.types.create({ data: { name: result.data.name, slug } });

    revalidatePath("/");
    revalidateTag("categories");
    revalidatePath("/Menu");
    return { message: "Category added." };
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
      return { message: "This name already exists. Please choose a different one." };
    }
    return { message: String(error) };
  }
}

// ── Item status toggles ──────────────────────────────────────────────────────
export async function toglleAvalability(id: string, isAvailableForPurchase: boolean) {
  await assertWritable();
  await db.item.update({ where: { id }, data: { isAvailableForPurchase } });
  revalidatePath("/");
  revalidatePath("/Menu");
  revalidateTag("products");
  revalidatePath("/admin/menuItems");
}

export async function toglleFeaturing(id: string, isFeatured: boolean) {
  await assertWritable();
  await db.item.update({ where: { id }, data: { featured: isFeatured } });
  revalidatePath("/");
  revalidateTag("featured-products");
  revalidatePath("/Menu");
  revalidatePath("/admin/menuItems");
}

export async function DeleteMenuItem(id: string) {
  await assertWritable();
  const item = await db.item.findUnique({ where: { id } });
  if (item?.image) await deleteImage(item.image);
  await db.item.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/Menu");
  revalidateTag("products");
  revalidatePath("/admin/menuItems");
}

export async function DeleteCategory(id: string) {
  await assertWritable();
  await db.types.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/Menu");
  revalidateTag("categories");
  revalidatePath("/admin/menuCategories");
}

// Persist the owner-chosen category order (array of category ids, in display
// order) in the "category_order" SiteSetting — no schema change needed. The
// website reads this to order categories on the Menu.
export async function reorderCategories(orderedIds: string[]) {
  await assertWritable();
  await db.siteSetting.upsert({
    where: { key: "category_order" },
    update: { value: JSON.stringify(orderedIds) },
    create: { key: "category_order", value: JSON.stringify(orderedIds) },
  });
  revalidatePath("/");
  revalidatePath("/Menu");
  revalidateTag("categories");
  revalidatePath("/admin/menuCategories");
}

// ── Sides ────────────────────────────────────────────────────────────────────
type SideGroupInput = {
  title: string;
  type: "RECOMMENDED" | "NO" | "EXTRA" | "SPICE";
  required?: boolean;
  maxSelect?: number | null;
  options: {
    label?: string;
    priceInCents?: number | null;
    linkedItemId?: string;
  }[];
};

export async function addItemSides(itemId: string, groups: SideGroupInput[]) {
  await assertWritable();
  try {
    await db.sideGroup.deleteMany({ where: { itemId } });

    for (const group of groups) {
      if (!group.options.length) continue;
      await db.sideGroup.create({
        data: {
          itemId,
          title: group.title,
          type: group.type,
          required: group.required ?? false,
          maxSelect: group.maxSelect ?? null,
          options: {
            create: group.options.map((opt) => ({
              label: opt.label ?? "",
              priceInCents: opt.priceInCents ?? null,
              linkedItemId: opt.linkedItemId ?? null,
            })),
          },
        },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/menuItems");
    revalidatePath("/Menu");
    revalidateTag("products");
    return { message: "group added successfully" };
  } catch (error) {
    console.error("Error adding sides:", error);
    return { message: String(error) };
  }
}

// ── Sample / demo menu ─────────────────────────────────────────────────────────
// Lets the owner load a few ready-made products with one click so they can try
// the whole ordering flow, then remove them. All grouped under one category so
// they're easy to clear.
const SAMPLE_CAT_SLUG = "sample-menu-demo";
const SAMPLE_ITEMS = [
  { name: "Classic Cheeseburger", description: "Sample item — beef patty, cheese, lettuce, tomato.", price: 9.99 },
  { name: "Margherita Pizza", description: "Sample item — fresh mozzarella, tomato, basil.", price: 12.99 },
  { name: "Caesar Salad", description: "Sample item — romaine, parmesan, croutons.", price: 7.99 },
  { name: "Crispy Fries", description: "Sample item — golden and salted.", price: 3.99 },
  { name: "Chocolate Brownie", description: "Sample item — warm and fudgy.", price: 4.99 },
  { name: "Soft Drink", description: "Sample item — your choice of soda.", price: 2.49 },
];

export async function seedSampleMenu() {
  await assertWritable();
  try {
    const cat = await db.types.upsert({
      where: { slug: SAMPLE_CAT_SLUG },
      update: {},
      create: { name: "Sample Menu (demo)", slug: SAMPLE_CAT_SLUG },
    });
    let added = 0;
    for (let i = 0; i < SAMPLE_ITEMS.length; i++) {
      const s = SAMPLE_ITEMS[i];
      const slug = `sample-${slugify(s.name)}`;
      if (await db.item.findUnique({ where: { slug } })) continue;
      await db.item.create({
        data: {
          name: s.name,
          description: s.description,
          priceInCents: Math.round(s.price * 100),
          slug,
          typeId: cat.id,
          isAvailableForPurchase: true,
          featured: i < 3,
        },
      });
      added++;
    }
    revalidatePath("/admin/menuItems");
    revalidatePath("/Menu");
    revalidatePath("/");
    revalidateTag("products");
    return { message: added ? `Sample menu ready — ${added} item${added === 1 ? "" : "s"} added.` : "Sample menu already loaded." };
  } catch (error) {
    console.error("seedSampleMenu error:", error);
    return { message: String(error) };
  }
}

export async function clearSampleMenu() {
  await assertWritable();
  try {
    const cat = await db.types.findUnique({ where: { slug: SAMPLE_CAT_SLUG } });
    if (!cat) return { message: "No sample menu to remove." };
    const items = await db.item.findMany({ where: { typeId: cat.id } });
    let removed = 0;
    for (const it of items) {
      try {
        await db.item.delete({ where: { id: it.id } });
        removed++;
      } catch {
        // Item was test-ordered (has an order) so it can't be deleted — just hide it.
        await db.item.update({ where: { id: it.id }, data: { isAvailableForPurchase: false } }).catch(() => {});
      }
    }
    await db.types.delete({ where: { id: cat.id } }).catch(() => {});
    revalidatePath("/admin/menuItems");
    revalidatePath("/Menu");
    revalidatePath("/");
    revalidateTag("products");
    return { message: `Sample menu removed${removed ? ` (${removed} item${removed === 1 ? "" : "s"})` : ""}.` };
  } catch (error) {
    console.error("clearSampleMenu error:", error);
    return { message: String(error) };
  }
}