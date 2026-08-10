"use server";

import db from "@/db/db";
import { cache } from "@/lib/handleCaching";
import { getSetting } from "@/lib/siteSettings";
import { applyCategoryOrder } from "@/lib/categoryOrder";

export const GetCateringProducts = cache(
  async () => {
    const products = await db.item.findMany({
      include: {
        sideGroups: {
          include: {
            options: true,
          },
        },
      },
      where: {
        isCaterable: true,
      },
    });
    return products;
  },
  ["cater-products-fun"],
  { tags: ["catering-products"], revalidate: 60 * 15 },
);

export const GetProducts = cache(
  async () => {
    const products = await db.item.findMany({
      include: {
        sideGroups: {
          include: {
            options: true,
          },
        },
      },
    });
    return products;
  },
  ["products-fun"],
  { tags: ["products"], revalidate: 60 * 15 },
);

export const GetFeaturedProducts = cache(
  async () => {
    const products = await db.item.findMany({
      include: {
        sideGroups: {
          include: {
            options: true,
          },
        },
      },
      where: { isAvailableForPurchase: true, featured: true },
    });
    return products;
  },
  ["featured-products-fun"],
  { tags: ["featured-products"], revalidate: 60 * 15 },
); // 15 minutes})

export const GetGategories = cache(
  async () => {
    const types = await db.types.findMany({ orderBy: { createdAt: "asc" } });
    // Show categories in the order the owner set in admin (Menu Categories).
    const orderJson = await getSetting("category_order", "[]");
    return applyCategoryOrder(types, orderJson);
  },
  ["categories-fun"],
  { tags: ["categories"], revalidate: 60 * 60 * 24 },
);

export const GetPlaces = cache(
  async () => {
    const places = await db.location.findMany();
    return places;
  },
  ["location"],
  { tags: ["location"], revalidate: 60 * 60 * 24 * 15 },
); // 15 days

export async function GetCartItems(cartId: string | null) {
  if (!cartId) return { items: [] };
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { sides: true } } },
  });

  if (!cart) return { items: [] };
  return cart;
}
