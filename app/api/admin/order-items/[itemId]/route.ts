import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { recalculateSessionTotal } from "@/lib/billing";

const bodySchema = z.object({
  reason: z.string().trim().max(200).optional(),
});

// Deletes a single line item out of a multi-item order — e.g. the customer
// ordered 3 dishes in one submission and only one was wrong — without
// touching the other items in that order. If it was the last item, the
// now-empty order is cleaned up too. Staff act unilaterally here; the
// customer just gets a reorder notice, not a request for approval.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const item = await db.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { include: { tableSession: { include: { table: true } }, items: true } } },
  });

  if (!item || item.order.tableSession.table.restaurantId !== adminSession.restaurantId) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const isLastItemInOrder = item.order.items.length === 1;
  const reason = parsed.data.reason;
  const itemSummary = `${item.quantity}x ${item.itemNameSnapshot}`;
  const reorderNoticeMessage = reason
    ? `Staff removed "${itemSummary}" from your order — ${reason}. Please reorder if you'd still like it.`
    : `Staff removed "${itemSummary}" from your order. Please reorder if you'd still like it.`;

  await db.$transaction([
    db.orderItem.delete({ where: { id: itemId } }),
    ...(isLastItemInOrder ? [db.order.delete({ where: { id: item.orderId } })] : []),
    db.tableSession.update({
      where: { id: item.order.tableSessionId },
      data: { reorderNoticeAt: new Date(), reorderNoticeMessage },
    }),
  ]);

  await recalculateSessionTotal(item.order.tableSessionId);

  return NextResponse.json({ ok: true });
}
