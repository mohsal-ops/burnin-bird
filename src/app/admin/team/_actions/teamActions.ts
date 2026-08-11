"use server";
import { assertWritable } from "@/lib/previewGuard";

import db from "@/db/db";
import { getCurrentAdmin } from "@/lib/getCurrentAdmin";
import { revalidatePath } from "next/cache";

export async function approveAdmin(adminId: string) {
  await assertWritable();
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) throw new Error("Unauthorized");

  await db.admin.update({
    where: { id: adminId },
    data: {
      status: "APPROVED",
      approvedById: currentAdmin.id,
      approvedAt: new Date(),
    },
  });

  revalidatePath("/admin/team");
}

export async function rejectAdmin(adminId: string) {
  await assertWritable();
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) throw new Error("Unauthorized");

  await db.admin.update({
    where: { id: adminId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/admin/team");
}

// Only the FIRST admin (the owner — the earliest-created account) may remove
// other team members. Guards on the server so it can't be called by anyone else.
export async function removeAdmin(adminId: string) {
  await assertWritable();
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) throw new Error("Unauthorized");

  const firstAdmin = await db.admin.findFirst({ orderBy: { createdAt: "asc" } });
  if (!firstAdmin || currentAdmin.id !== firstAdmin.id) {
    throw new Error("Only the owner can remove team members.");
  }
  if (adminId === firstAdmin.id) {
    throw new Error("The owner account can't be removed.");
  }

  await db.admin.delete({ where: { id: adminId } });
  revalidatePath("/admin/team");
}
