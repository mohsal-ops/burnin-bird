import db from "@/db/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const places = await db.location.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(places);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}