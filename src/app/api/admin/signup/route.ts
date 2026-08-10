import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import db from "@/db/db";
import { hashPassword } from "@/lib/password";
import { sendMail } from "@/lib/email";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { SITE_CONFIG } from "@/lib/siteConfig";

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(`admin-signup:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  const { name, email, password } = await req.json();

  if (
    typeof name !== "string" || name.trim().length < 2 ||
    typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" || password.length < 8
  ) {
    return NextResponse.json(
      { error: "Enter a valid name, email, and a password with at least 8 characters." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.admin.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = randomBytes(32).toString("hex");

  await db.admin.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      verificationToken,
      verificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/admin/verify?token=${verificationToken}`;

  try {
    await sendMail({
      to: normalizedEmail,
      subject: `Verify your ${SITE_CONFIG.name} admin account`,
      html: `
        <h2>Verify your email</h2>
        <p>Hi ${name.trim()}, confirm your email to continue creating your admin account.</p>
        <p><a href="${verifyUrl}">Verify email address</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send admin verification email:", err);
    return NextResponse.json(
      { error: "Account created, but the verification email failed to send. Contact an existing admin." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
