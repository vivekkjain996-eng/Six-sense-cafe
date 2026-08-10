import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recalculateSessionTotal } from "@/lib/billing";

const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = placeOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

  const session = await db.tableSession.findUnique({ where: { id: sessionId } });
  if (!session || session.status !== "OPEN") {
    return NextResponse.json({ error: "This table's bill is not open" }, { status: 400 });
  }

  const menuItemIds = parsed.data.items.map((i) => i.menuItemId);
  const menuItems = await db.menuItem.findMany({ where: { id: { in: menuItemIds } } });
  const menuItemById = new Map(menuItems.map((m) => [m.id, m]));

  for (const item of parsed.data.items) {
    const menuItem = menuItemById.get(item.menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      return NextResponse.json(
        { error: "One or more selected items are no longer available" },
        { status: 400 },
      );
    }
  }

  const order = await db.order.create({
    data: {
      tableSessionId: sessionId,
      items: {
        create: parsed.data.items.map((item) => {
          const menuItem = menuItemById.get(item.menuItemId)!;
          return {
            menuItemId: menuItem.id,
            itemNameSnapshot: menuItem.name,
            priceSnapshot: menuItem.price,
            quantity: item.quantity,
            lineTotal: menuItem.price * item.quantity,
          };
        }),
      },
    },
    include: { items: true },
  });

  await recalculateSessionTotal(sessionId);

  // The table only becomes OCCUPIED once a real order lands on its bill —
  // not just from someone opening the menu (see lib/tableSession.ts).
  await db.restaurantTable.update({
    where: { id: session.tableId },
    data: { status: "OCCUPIED" },
  });

  return NextResponse.json(order, { status: 201 });
}
