import { NextResponse } from "next/server";
import { resolveTableSession } from "@/lib/tableSession";

export async function GET(_req: Request, { params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = await params;
  const resolved = await resolveTableSession(qrToken);

  if (!resolved) {
    return NextResponse.json({ error: "Invalid or expired QR code" }, { status: 404 });
  }

  return NextResponse.json({
    restaurantId: resolved.table.restaurantId,
    restaurantName: resolved.restaurant.name,
    tableId: resolved.table.id,
    tableNumber: resolved.table.tableNumber,
    sessionId: resolved.session.id,
  });
}
