import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { generateTableQrPng } from "@/lib/qr";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const table = await db.restaurantTable.findFirst({
    where: { id, restaurantId: session.restaurantId },
  });
  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const png = await generateTableQrPng(table.qrToken, table.tableNumber);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="table-${table.tableNumber}-qr.png"`,
    },
  });
}
