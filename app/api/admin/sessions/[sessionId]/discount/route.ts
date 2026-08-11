import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { recalculateSessionTotal } from "@/lib/billing";

const bodySchema = z.object({
  discountPercent: z.number().min(0).max(100),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (adminSession.role === "WAITER") {
    return NextResponse.json({ error: "Only the owner can apply a discount" }, { status: 403 });
  }

  const { sessionId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a discount percent between 0 and 100" }, { status: 400 });
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
    data: { discountPercent: parsed.data.discountPercent },
  });
  await recalculateSessionTotal(sessionId);

  return NextResponse.json({ ok: true });
}
