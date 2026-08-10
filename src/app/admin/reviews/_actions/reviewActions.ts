"use server";

import db from "@/db/db";
import { revalidatePath } from "next/cache";

type ActionResult = { message?: string; error?: string };

function dicebearFor(name: string): string {
  return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(name)}`;
}

export async function addReview(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const review = String(formData.get("review") ?? "").trim();
  const avatar = String(formData.get("avatar") ?? "").trim();

  if (name.length < 2) return { error: "Enter the reviewer's name." };
  if (review.length < 5) return { error: "Enter the review text." };

  try {
    const maxOrder = await db.review.aggregate({ _max: { order: true } });

    await db.review.create({
      data: {
        name,
        review,
        avatar: avatar || dicebearFor(name),
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/reviews");
    return { message: "Review added." };
  } catch (error) {
    console.error("addReview error:", error);
    return { error: "Failed to add review." };
  }
}

export async function updateReview(
  id: string,
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const review = String(formData.get("review") ?? "").trim();
  const avatar = String(formData.get("avatar") ?? "").trim();

  if (name.length < 2) return { error: "Enter the reviewer's name." };
  if (review.length < 5) return { error: "Enter the review text." };

  try {
    await db.review.update({
      where: { id },
      data: { name, review, avatar: avatar || dicebearFor(name) },
    });

    revalidatePath("/");
    revalidatePath("/admin/reviews");
    return { message: "Review updated." };
  } catch (error) {
    console.error("updateReview error:", error);
    return { error: "Failed to update review." };
  }
}

export async function deleteReview(id: string): Promise<ActionResult> {
  await db.review.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  return { message: "Review deleted." };
}

export async function reorderReviews(ids: string[]): Promise<ActionResult> {
  await Promise.all(
    ids.map((id, index) => db.review.update({ where: { id }, data: { order: index } }))
  );

  revalidatePath("/");
  revalidatePath("/admin/reviews");
  return { message: "Order updated." };
}
