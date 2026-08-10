import { db } from "@/lib/db";

export async function recalculateSessionTotal(tableSessionId: string) {
  const orders = await db.order.findMany({
    where: { tableSessionId, status: { not: "CANCELLED" } },
    include: { items: true },
  });

  const subtotal = orders.flatMap((o) => o.items).reduce((sum, item) => sum + item.lineTotal, 0);

  await db.tableSession.update({
    where: { id: tableSessionId },
    data: { subtotal, tax: 0, grandTotal: subtotal },
  });
}
