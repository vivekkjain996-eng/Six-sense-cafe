import { db } from "@/lib/db";
import { maybeRepeatWaiterCallNotification } from "@/lib/push";

export async function getLiveTables(restaurantId: string) {
  const tables = await db.restaurantTable.findMany({
    where: { restaurantId },
    orderBy: { tableNumber: "asc" },
    include: {
      sessions: {
        where: { status: "OPEN" },
        include: {
          orders: {
            orderBy: { placedAt: "asc" },
            include: { items: true },
          },
        },
      },
    },
  });

  return tables.map((table) => {
    const openSession = table.sessions[0];

    if (openSession?.waiterCallRequestedAt) {
      maybeRepeatWaiterCallNotification({
        id: table.id,
        tableNumber: table.tableNumber,
        restaurantId,
        session: {
          id: openSession.id,
          waiterCallRequestedAt: openSession.waiterCallRequestedAt,
          waiterCallLastNotifiedAt: openSession.waiterCallLastNotifiedAt,
        },
      }).catch(() => {});
    }

    return {
      id: table.id,
      tableNumber: table.tableNumber,
      status: table.status,
      session: openSession
        ? {
            id: openSession.id,
            grandTotal: openSession.grandTotal,
            paymentStatus: openSession.paymentStatus,
            waiterCallRequestedAt: openSession.waiterCallRequestedAt?.toISOString() ?? null,
            orders: openSession.orders.map((order) => ({
              id: order.id,
              status: order.status,
              placedAt: order.placedAt.toISOString(),
              items: order.items.map((item) => ({
                id: item.id,
                itemNameSnapshot: item.itemNameSnapshot,
                quantity: item.quantity,
                lineTotal: item.lineTotal,
              })),
            })),
          }
        : null,
    };
  });
}

export type LiveTable = Awaited<ReturnType<typeof getLiveTables>>[number];
