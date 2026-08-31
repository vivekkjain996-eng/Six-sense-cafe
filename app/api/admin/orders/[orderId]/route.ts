import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { recalculateSessionTotal } from "@/lib/billing";

const bodySchema = z.object({
  reason: z.string().trim().max(200).optional(),
});

// A hard delete (not a CANCELLED status) for orders staff entered by
// mistake — e.g. the wrong table or wrong item — so it disappears from the
// bill entirely rather than sticking around as a cancelled line item. The
// customer is nudged to reorder via a notice on their session instead of a
// silent removal.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { tableSession: { include: { table: true } }, items: true },
  });

  if (!order || order.tableSession.table.restaurantId !== adminSession.restaurantId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.itemNameSnapshot}`).join(", ");
  const reason = parsed.data.reason;
  const reorderNoticeMessage = reason
    ? `Staff removed your order (${itemsSummary}) — ${reason}. Please reorder if you'd still like it.`
    : `Staff removed your order (${itemsSummary}). Please reorder if you'd still like it.`;

  await db.$transaction([
    db.orderItem.deleteMany({ where: { orderId } }),
    db.order.delete({ where: { id: orderId } }),
    db.tableSession.update({
      where: { id: order.tableSessionId },
      data: { reorderNoticeAt: new Date(), reorderNoticeMessage },
    }),
  ]);

  await recalculateSessionTotal(order.tableSessionId);

  return NextResponse.json({ ok: true });
}
