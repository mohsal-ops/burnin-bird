import db from "@/db/db";
import { requireAdmin } from "@/lib/adminAuth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    await db.location.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete place" }, { status: 500 });
  }
}