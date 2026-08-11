import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

// Wipes all orders/bills for this restaurant so reports start clean —
// menu, tables, QR codes, and staff accounts are untouched.
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "OWNER") {
    return NextResponse.json({ error: "Only the owner can clear data" }, { status: 403 });
  }

  const restaurantId = session.restaurantId;

  await db.$transaction([
    db.orderItem.deleteMany({
      where: { order: { tableSession: { table: { restaurantId } } } },
    }),
    db.order.deleteMany({
      where: { tableSession: { table: { restaurantId } } },
    }),
    db.tableSession.deleteMany({
      where: { table: { restaurantId } },
    }),
    db.restaurantTable.updateMany({
      where: { restaurantId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
