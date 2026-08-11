import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyWaitersOfCall } from "@/lib/push";

export async function POST(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  const session = await db.tableSession.findUnique({
    where: { id: sessionId },
    include: { table: true },
  });
  if (!session || session.status !== "OPEN") {
    return NextResponse.json({ error: "This table's bill is not open" }, { status: 400 });
  }

  const updated = await db.tableSession.update({
    where: { id: sessionId },
    data: { waiterCallRequestedAt: new Date() },
  });

  notifyWaitersOfCall(session.table.restaurantId, session.table.tableNumber).catch(() => {});

  return NextResponse.json({ waiterCallRequestedAt: updated.waiterCallRequestedAt });
}
