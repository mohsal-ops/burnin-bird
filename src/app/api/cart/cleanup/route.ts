import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Archives stale carts: anything still "open" and untouched for 24h+ is
// almost certainly abandoned, not an order in progress. Call this on-demand
// (e.g. from an external cron hitting this URL) to keep the admin orders
// dashboard from filling up with dead sessions.
export async function GET() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // Carts that picked up items but never checked out - archive as abandoned
    // so they still show up in the orders dashboard's history.
    const archived = await db.cart.updateMany({
      where: { status: "open", updatedAt: { lt: cutoff }, items: { some: {} } },
      data: { status: "abandoned" },
    });

    // Carts created just by a page visit (getOrCreateCart runs on every first
    // load) that never got an item added - nothing worth keeping a record of.
    const emptyCarts = await db.cart.findMany({
      where: { status: "open", updatedAt: { lt: cutoff }, items: { none: {} } },
      select: { id: true },
    });
    const deleted = await db.cart.deleteMany({ where: { id: { in: emptyCarts.map((c) => c.id) } } });

    revalidatePath("/admin/orders");
    return NextResponse.json({ ok: true, archived: archived.count, deleted: deleted.count });
  } catch (error) {
    console.error("Cart cleanup error:", error);
    return NextResponse.json({ ok: false, message: "Cleanup failed" }, { status: 500 });
  }
}
