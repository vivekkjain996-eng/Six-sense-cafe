import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "OWNER") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { id } = await params;

  const staff = await db.adminUser.findFirst({
    where: { id, restaurantId: session.restaurantId, role: "WAITER" },
  });
  if (!staff) {
    return NextResponse.json({ error: "Staff account not found" }, { status: 404 });
  }

  await db.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
