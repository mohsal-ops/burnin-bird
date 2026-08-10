"use server";

import { randomBytes } from "crypto";
import db from "@/db/db";
import { getCurrentAdmin } from "@/lib/getCurrentAdmin";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { sendMail } from "@/lib/email";
import { revalidatePath } from "next/cache";

const EMAIL_CHANGE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateName(name: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");

  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Name must be at least 2 characters." };

  await db.admin.update({ where: { id: admin.id }, data: { name: trimmed } });
  revalidatePath("/admin/profile");
  return { message: "Name updated." };
}

export async function requestEmailChange(newEmail: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");

  const normalized = newEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) return { error: "Enter a valid email address." };
  if (normalized === admin.email) return { error: "That's already your current email." };

  const existing = await db.admin.findUnique({ where: { email: normalized } });
  if (existing) return { error: "That email is already in use by another admin." };

  const token = randomBytes(32).toString("hex");

  await db.admin.update({
    where: { id: admin.id },
    data: {
      pendingEmail: normalized,
      verificationToken: token,
      verificationTokenExpiresAt: new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS),
    },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/verify-email-change?token=${token}`;

  try {
    await sendMail({
      to: normalized,
      subject: `Confirm your new ${SITE_CONFIG.name} admin email`,
      html: `
        <h2>Confirm your new email</h2>
        <p>Hi ${admin.name}, click below to make this your new admin sign-in email.</p>
        <p><a href="${verifyUrl}">Confirm new email address</a></p>
        <p>This link expires in 24 hours. Your current sign-in email stays active until then.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send email-change verification:", err);
    return { error: "Failed to send the confirmation email. Try again later." };
  }

  return { message: `Confirmation email sent to ${normalized}. Your sign-in email won't change until you click the link.` };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");

  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };

  const valid = await verifyPassword(currentPassword, admin.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await hashPassword(newPassword);
  await db.admin.update({ where: { id: admin.id }, data: { passwordHash } });

  return { message: "Password updated." };
}
