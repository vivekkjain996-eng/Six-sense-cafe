import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { generateTableQrSvg } from "@/lib/qr";

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

  const svg = await generateTableQrSvg(table.qrToken, table.tableNumber);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="table-${table.tableNumber}-qr.svg"`,
    },
  });
}
