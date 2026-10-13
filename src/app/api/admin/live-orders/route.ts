import { NextResponse } from "next/server";
import db from "@/db/db";
import { getAccess } from "@/lib/getAccess";

export const dynamic = "force-dynamic";

// Light poll for the dashboard-wide new-order alarm (GlobalOrderAlert). Only
// paid orders still waiting on the kitchen (status "new"), last 24h, and only
// the fields the alarm shows. One indexed query.
export async function GET() {
  const access = await getAccess();
  if (access.mode === "none") return NextResponse.json({ orders: [] }, { status: 401 });
  const since = new Date(Date.now() - 24 * 3600_000);
  const orders = await db.cart
    .findMany({
      where: { status: "new", createdAt: { gte: since } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        items: { select: { customerName: true, deliveryAddress: true, orderType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    .catch(() => []);
  return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
