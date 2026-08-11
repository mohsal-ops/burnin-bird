"use server";
import { assertWritable } from "@/lib/previewGuard";
import db from "@/db/db";
import { revalidatePath } from "next/cache";

export async function updateCateringStatus(id: string, status: string) {
  await assertWritable();
  await db.cateringRequest.update({ where: { id }, data: { status } });
  revalidatePath("/admin/catering");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteCateringRequest(id: string) {
  await assertWritable();
  await db.cateringRequest.delete({ where: { id } });
  revalidatePath("/admin/catering");
  revalidatePath("/admin");
  return { ok: true };
}
