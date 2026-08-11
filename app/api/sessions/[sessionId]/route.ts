import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { maybeRepeatWaiterCallNotification } from "@/lib/push";

export async function GET(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  const session = await db.tableSession.findUnique({
    where: { id: sessionId },
    include: {
      table: true,
      orders: {
        orderBy: { placedAt: "asc" },
        include: { items: true },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.waiterCallRequestedAt) {
    maybeRepeatWaiterCallNotification({
      id: session.table.id,
      tableNumber: session.table.tableNumber,
      restaurantId: session.table.restaurantId,
      session: {
        id: session.id,
        waiterCallRequestedAt: session.waiterCallRequestedAt,
        waiterCallLastNotifiedAt: session.waiterCallLastNotifiedAt,
      },
    }).catch(() => {});
  }

  return NextResponse.json(session);
}
