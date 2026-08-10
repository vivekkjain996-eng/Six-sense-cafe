import { db } from "@/lib/db";

export async function resolveTableSession(qrToken: string) {
  const table = await db.restaurantTable.findUnique({
    where: { qrToken },
    include: { restaurant: true },
  });

  if (!table) {
    return null;
  }

  let openSession = await db.tableSession.findFirst({
    where: { tableId: table.id, status: "OPEN" },
  });

  if (!openSession) {
    // Opening a session (i.e. loading the menu) does NOT mark the table
    // occupied — someone can scan a QR code just to look without ordering.
    // The table only becomes OCCUPIED once an actual order is placed
    // (see the orders route), so idle QR scans don't falsely tie up a table.
    openSession = await db.tableSession.create({
      data: { tableId: table.id },
    });
  }

  return { table, restaurant: table.restaurant, session: openSession };
}
