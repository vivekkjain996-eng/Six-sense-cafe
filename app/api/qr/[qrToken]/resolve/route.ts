import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = await params;
  const table = await db.restaurantTable.findUnique({
    where: { qrToken },
    include: { restaurant: true },
  });

  if (!table) {
    return NextResponse.json({ error: "Invalid or expired QR code" }, { status: 404 });
  }

  let openSession = await db.tableSession.findFirst({
    where: { tableId: table.id, status: "OPEN" },
  });

  if (!openSession) {
    openSession = await db.tableSession.create({
      data: { tableId: table.id },
    });
    await db.restaurantTable.update({
      where: { id: table.id },
      data: { status: "OCCUPIED" },
    });
  }

  return NextResponse.json({
    restaurantId: table.restaurantId,
    restaurantName: table.restaurant.name,
    tableId: table.id,
    tableNumber: table.tableNumber,
    sessionId: openSession.id,
  });
}
