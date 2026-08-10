import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { recalculateSessionTotal } from "@/lib/billing";

const bodySchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { tableSession: { include: { table: true } } },
  });

  if (!order || order.tableSession.table.restaurantId !== adminSession.restaurantId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const updated = await db.order.update({
    where: { id: orderId },
    data: { status: parsed.data.status },
  });

  // Cancelling (or un-cancelling) an order changes what counts toward the bill.
  await recalculateSessionTotal(order.tableSessionId);

  return NextResponse.json(updated);
}
