import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const session = await db.tableSession.findUnique({
    where: { id: sessionId },
    include: { table: true },
  });

  if (!session || session.table.restaurantId !== adminSession.restaurantId) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  await db.tableSession.update({
    where: { id: sessionId },
    data: { waiterCallRequestedAt: null },
  });

  return NextResponse.json({ ok: true });
}
