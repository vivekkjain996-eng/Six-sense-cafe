import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

const bodySchema = z.object({
  paymentMethod: z.enum(["CASH", "CARD", "ONLINE"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Select how the bill was paid" }, { status: 400 });
  }

  const session = await db.tableSession.findUnique({
    where: { id: sessionId },
    include: { table: true },
  });

  if (!session || session.table.restaurantId !== adminSession.restaurantId) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  if (session.status !== "OPEN") {
    return NextResponse.json({ error: "This bill is already closed" }, { status: 400 });
  }

  await db.tableSession.update({
    where: { id: sessionId },
    data: {
      status: "CLOSED",
      paymentStatus: "PAID",
      paymentMethod: parsed.data.paymentMethod,
      closedAt: new Date(),
    },
  });

  await db.restaurantTable.update({
    where: { id: session.tableId },
    data: { status: "AVAILABLE" },
  });

  return NextResponse.json({ ok: true });
}
