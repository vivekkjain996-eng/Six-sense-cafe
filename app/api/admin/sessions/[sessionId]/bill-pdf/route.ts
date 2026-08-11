import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateBillPdf } from "@/lib/billPdf";
import { formatISTDateTime } from "@/lib/time";

export async function GET(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const session = await db.tableSession.findUnique({
    where: { id: sessionId },
    include: {
      table: { include: { restaurant: true } },
      orders: { orderBy: { placedAt: "asc" }, include: { items: true } },
    },
  });

  if (!session || session.table.restaurantId !== adminSession.restaurantId) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const activeOrders = session.orders.filter((o) => o.status !== "CANCELLED");
  const items = activeOrders.flatMap((o) =>
    o.items.map((item) => ({
      name: item.itemNameSnapshot,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  );

  const pdfBytes = await generateBillPdf({
    restaurantName: session.table.restaurant.name,
    tableNumber: session.table.tableNumber,
    openedAtLabel: `Bill opened ${formatISTDateTime(session.openedAt)} IST`,
    items,
    subtotal: session.subtotal,
    discountPercent: session.discountPercent,
    discountAmount: session.subtotal * (session.discountPercent / 100),
    grandTotal: session.grandTotal,
    paymentStatus: session.paymentStatus,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="table-${session.table.tableNumber}-bill.pdf"`,
    },
  });
}
