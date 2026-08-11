import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getLiveTables } from "@/lib/liveTables";
import { db } from "@/lib/db";
import WaiterLogoutButton from "@/components/waiter/WaiterLogoutButton";
import WaiterAlertBoard from "@/components/waiter/WaiterAlertBoard";

export default async function WaiterPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/waiter/login");
  }

  const [tables, restaurant] = await Promise.all([
    getLiveTables(session!.restaurantId),
    db.restaurant.findUnique({ where: { id: session!.restaurantId } }),
  ]);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 shadow-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-lg font-semibold text-white">{restaurant?.name ?? "Restaurant"}</p>
            <p className="text-xs text-amber-400">Waiter View</p>
          </div>
          <WaiterLogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4">
        <WaiterAlertBoard initialTables={tables} />
      </main>
    </div>
  );
}
