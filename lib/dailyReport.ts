import { db } from "@/lib/db";

// "Today" must be computed in local time, not UTC (toISOString() gives UTC),
// since dayBounds() below parses the date string as local midnight. Using
// UTC for one and local for the other causes a bill closed just after local
// midnight to fall outside "today"'s window whenever local time is ahead of
// UTC (e.g. IST) — the report would show ₹0 for a bill closed minutes ago.
export function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);
  return { start, end };
}

export async function getDailyReport(restaurantId: string, dateStr: string) {
  const { start, end } = dayBounds(dateStr);

  const closedSessions = await db.tableSession.findMany({
    where: {
      table: { restaurantId },
      status: "CLOSED",
      closedAt: { gte: start, lte: end },
    },
    orderBy: { closedAt: "asc" },
    include: { table: true },
  });

  const byMethod: Record<string, number> = { CASH: 0, CARD: 0, ONLINE: 0 };
  let total = 0;

  for (const s of closedSessions) {
    total += s.grandTotal;
    if (s.paymentMethod && byMethod[s.paymentMethod] !== undefined) {
      byMethod[s.paymentMethod] += s.grandTotal;
    }
  }

  return {
    date: dateStr,
    total,
    byMethod,
    bills: closedSessions.map((s) => ({
      id: s.id,
      tableNumber: s.table.tableNumber,
      // Non-null: the query filters on closedAt being within [start, end].
      closedAt: s.closedAt!.toISOString(),
      grandTotal: s.grandTotal,
      paymentMethod: s.paymentMethod,
    })),
  };
}
