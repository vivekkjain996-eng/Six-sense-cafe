import { db } from "@/lib/db";

export async function recalculateSessionTotal(tableSessionId: string) {
  const [orders, session] = await Promise.all([
    db.order.findMany({
      where: { tableSessionId, status: { not: "CANCELLED" } },
      include: { items: true },
    }),
    db.tableSession.findUniqueOrThrow({ where: { id: tableSessionId } }),
  ]);

  const subtotal = orders.flatMap((o) => o.items).reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = subtotal * (session.discountPercent / 100);
  const grandTotal = subtotal - discountAmount + session.tax;

  await db.tableSession.update({
    where: { id: tableSessionId },
    data: { subtotal, grandTotal },
  });
}
