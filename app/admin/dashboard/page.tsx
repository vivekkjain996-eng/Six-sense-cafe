import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const tables = await db.restaurantTable.findMany({
    where: { restaurantId: session!.restaurantId },
    orderBy: { tableNumber: "asc" },
    include: {
      sessions: {
        where: { status: "OPEN" },
        include: { orders: { include: { items: true } } },
      },
    },
  });

  return (
    <main className="min-h-screen p-6">
      <h1 className="mb-6 text-2xl font-semibold">Live Orders</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => {
          const openSession = table.sessions[0];
          const orderCount = openSession?.orders.length ?? 0;

          return (
            <div key={table.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Table {table.tableNumber}</h2>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    table.status === "OCCUPIED"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {table.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {openSession ? `${orderCount} order(s) on open bill` : "No active bill"}
              </p>
            </div>
          );
        })}
      </div>

      {tables.length === 0 && (
        <p className="text-gray-600">
          No tables yet. Create tables via <code>POST /api/admin/tables</code>.
        </p>
      )}
    </main>
  );
}
