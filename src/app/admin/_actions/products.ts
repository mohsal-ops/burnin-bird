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

// ── Modifier groups (generic owner-managed) ──────────────────────────────────
// Replaces ALL modifier groups for an item with the given ordered set (the admin
// UI always sends the full list). Persists `order` on groups + options and
// enforces that a required group has at least one real option.
type ModifierGroupInput = {
  title: string;
  type: "RECOMMENDED" | "NO" | "EXTRA" | "SPICE" | "SIDE";
  required?: boolean;
  maxSelect?: number | null;
  order?: number;
  options: {
    label?: string;
    priceInCents?: number | null;
    linkedItemId?: string | null;
    order?: number;
  }[];
};

export async function saveItemModifiers(itemId: string, groups: ModifierGroupInput[]) {
  await assertWritable();

  // Validate before touching the DB.
  for (const g of groups) {
    if (!(g.title ?? "").trim()) {
      return { error: "Every modifier group needs a title." };
    }
    const realOptions = (g.options ?? []).filter((o) => (o.label ?? "").trim().length > 0);
    if ((g.required ?? false) && realOptions.length === 0) {
      return {
        error: `"${g.title.trim()}" is marked required, so it needs at least one option.`,
      };
    }
  }

  try {
    await db.sideGroup.deleteMany({ where: { itemId } });

    for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi];
      const realOptions = (group.options ?? []).filter((o) => (o.label ?? "").trim().length > 0);
      if (realOptions.length === 0) continue; // drop empty (optional) groups
      await db.sideGroup.create({
        data: {
          itemId,
          title: group.title.trim(),
          type: group.type,
          required: group.required ?? false,
          maxSelect: group.maxSelect ?? null,
          order: group.order ?? gi,
          options: {
            create: realOptions.map((opt, oi) => ({
              label: (opt.label ?? "").trim(),
              priceInCents: opt.priceInCents ?? null,
              linkedItemId: opt.linkedItemId ?? null,
              order: opt.order ?? oi,
            })),
          },
        },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/menuItems");
    revalidatePath(`/admin/menuItems/${itemId}/edit`);
    revalidatePath("/Menu");
    revalidateTag("products");
    return { ok: true, message: "Modifiers saved." };
  } catch (error) {
    console.error("saveItemModifiers error:", error);
    return { error: String(error) };
  }
}

// ── Sample / demo menu ─────────────────────────────────────────────────────────
// Lets the owner load a few ready-made products with one click so they can try
// the whole ordering flow, then remove them. All grouped under one category so
// they're easy to clear.
// Every sample category + item is slugged "sample-…" so clearSampleMenu can drop
// the whole set no matter which cuisine was loaded.
const SAMPLE_SLUG_PREFIX = "sample-";

type SampleOpt = { label: string; price?: number }; // dollars; omit = free
type SampleGroup = {
  title: string;
  type: "EXTRA" | "RECOMMENDED" | "NO" | "SPICE" | "SIDE";
  required?: boolean;
  maxSelect?: number | null;
  options: SampleOpt[];
};
type SampleItem = { name: string; description: string; price: number; groups?: SampleGroup[] };
type SampleCategory = { name: string; items: SampleItem[] };

export type SampleCuisine = "burger" | "pizza";

// Static starter menus lifted from real client sites so a new owner opens with a
// realistic, cuisine-appropriate menu: "burger" = Burgers & Chicken (from the
// burnin site), "pizza" = Pizza (from the pizza-gallery site). Kept faithful to
// the source menus (no invented modifier groups); owners add modifiers via the
// item editor.
const SAMPLE_MENUS: Record<SampleCuisine, { label: string; categories: SampleCategory[] }> = {
  burger: {
    label: "Burgers & Chicken",
    categories: [
      { name: "Sandwiches", items: [
        { name: "Classic Nashville", price: 12.99, description: "Two crispy fried chicken breasts dipped in our signature Nashville hot oil, topped with house sauce, coleslaw & pickles." },
        { name: "Honey Butter", price: 12.99, description: "Two crispy fried chicken breasts in Nashville hot oil, topped with whipped honey butter & melted cheddar." },
        { name: "The Buffalo", price: 12.99, description: "Two crispy fried chicken breasts in Nashville hot oil, topped with buffalo sauce, ranch & melted cheddar." },
      ] },
      { name: "Jr. Sandwiches", items: [
        { name: "Jr. Classic Nashville", price: 8.99, description: "One crispy fried chicken breast in Nashville hot oil, topped with house sauce, coleslaw & pickles." },
      ] },
      { name: "Jumbo Tenders", items: [
        { name: "3 Piece Jumbo Tenders", price: 13.99, description: "Three jumbo tenders in our signature Nashville hot oil; served with pickles." },
      ] },
      { name: "Wings", items: [
        { name: "5 Piece Wings", price: 7.99, description: "Five crispy wings tossed in our signature seasoning." },
      ] },
      { name: "Bowls", items: [
        { name: "Loaded Mac & Cheese", price: 13.99, description: "Creamy mac & cheese topped with two chopped fried chicken breasts, house sauce, pickles & melted cheese." },
      ] },
      { name: "Extras", items: [
        { name: "Single Breast", price: 4.99, description: "One crispy fried chicken breast." },
      ] },
      { name: "Drinks", items: [
        { name: "Orange Crush", price: 2.99, description: "Chilled can." },
        { name: "Starry", price: 2.99, description: "Chilled can." },
      ] },
      { name: "Milkshakes", items: [
        { name: "Chocolate Milkshake", price: 8.99, description: "Thick, hand-spun chocolate milkshake." },
      ] },
    ],
  },
  pizza: {
    label: "Pizza",
    categories: [
      { name: "Pizzas", items: [
        { name: "Basquiat BBQ Chicken", price: 32.5, description: "BBQ sauce, halal chicken, caramelized onions, red bell peppers, and mozzarella." },
        { name: "Mona Lisa Margherita", price: 27.5, description: "Fresh mozzarella, vine-ripened tomatoes, basil, and olive oil." },
        { name: "Picasso Pepperoni", price: 31.25, description: "Halal pepperoni, mozzarella, and red sauce — bold, abstract, unforgettable." },
        { name: "The Blank Canvas", price: 27, description: "Classic cheese pizza — simple, timeless, and perfectly balanced." },
        { name: "The Starry Night", price: 31.25, description: "Grilled halal chicken and sauteed mushrooms over creamy halal vodka sauce, finished with mozzarella and fresh basil." },
      ] },
      { name: "Combo Deals", items: [
        { name: "Two 18 Inch Pizzas Combo", price: 125, description: "Two 18-inch pizzas, 12-piece wings and 2 fries." },
      ] },
      { name: "Sides", items: [
        { name: "Fries", price: 7, description: "Crispy golden fries." },
      ] },
      { name: "Drinks", items: [
        { name: "Can Soda", price: 2, description: "Choice of cola, diet cola, or lemon-lime soda." },
      ] },
    ],
  },
};

export async function seedSampleMenu(cuisine: SampleCuisine = "burger") {
  await assertWritable();
  const menu = SAMPLE_MENUS[cuisine];
  if (!menu) return { message: "Unknown sample menu." };
  try {
    let added = 0;
    let featuredCount = 0;
    for (const cat of menu.categories) {
      const catSlug = `${SAMPLE_SLUG_PREFIX}${slugify(cat.name)}`;
      const type = await db.types.upsert({
        where: { slug: catSlug },
        update: {},
        create: { name: cat.name, slug: catSlug },
      });
      for (const item of cat.items) {
        const slug = `${SAMPLE_SLUG_PREFIX}${slugify(item.name)}`;
        if (await db.item.findUnique({ where: { slug } })) continue;
        const created = await db.item.create({
          data: {
            name: item.name,
            description: item.description,
            priceInCents: Math.round(item.price * 100),
            slug,
            typeId: type.id,
            isAvailableForPurchase: true,
            featured: featuredCount < 3,
          },
        });
        featuredCount++;
        const groups = item.groups ?? [];
        for (let gi = 0; gi < groups.length; gi++) {
          const g = groups[gi];
          await db.sideGroup.create({
            data: {
              itemId: created.id,
              title: g.title,
              type: g.type,
              required: g.required ?? false,
              maxSelect: g.maxSelect ?? null,
              order: gi,
              options: {
                create: g.options.map((o, oi) => ({
                  label: o.label,
                  priceInCents: o.price == null ? null : Math.round(o.price * 100),
                  order: oi,
                })),
              },
            },
          });
        }
        added++;
      }
    }
    revalidatePath("/admin/menuItems");
    revalidatePath("/Menu");
    revalidatePath("/");
    revalidateTag("products");
    return {
      message: added
        ? `${menu.label} sample menu ready — ${added} item${added === 1 ? "" : "s"} added.`
        : `${menu.label} sample menu already loaded.`,
    };
  } catch (error) {
    console.error("seedSampleMenu error:", error);
    return { message: String(error) };
  }
}

export async function clearSampleMenu() {
  await assertWritable();
  try {
    const cats = await db.types.findMany({ where: { slug: { startsWith: SAMPLE_SLUG_PREFIX } } });
    if (cats.length === 0) return { message: "No sample menu to remove." };
    let removed = 0;
    for (const cat of cats) {
      const items = await db.item.findMany({ where: { typeId: cat.id } });
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
    }
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