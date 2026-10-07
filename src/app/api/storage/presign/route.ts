import { NextResponse } from "next/server";
import { getAccess } from "@/lib/getAccess";
import { objectKey, r2Enabled, r2PresignPut } from "@/lib/r2";

export const runtime = "nodejs";

// Hands the admin's browser a short-lived presigned PUT URL so photos go
// browser → Cloudflare R2 directly (no file bytes through a Vercel function: no
// 4.5 MB body cap, almost no CPU). 501 = R2 not configured → caller falls back.
const FOLDERS = new Set(["gallery", "site-images", "products", "partners"]);

export async function POST(req: Request) {
  if (!r2Enabled()) return NextResponse.json({ error: "R2 not configured" }, { status: 501 });
  const access = await getAccess();
  if (access.mode !== "admin") return NextResponse.json({ error: "Not authorized to upload." }, { status: 403 });
  const { folder, filename, contentType } = (await req.json().catch(() => ({}))) as { folder?: string; filename?: string; contentType?: string };
  if (!folder || !FOLDERS.has(folder)) return NextResponse.json({ error: "Bad folder" }, { status: 400 });
  if (!contentType?.startsWith("image/")) return NextResponse.json({ error: "Images only" }, { status: 400 });
  return NextResponse.json(r2PresignPut(objectKey(folder, filename || "photo")));
}
