import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getLiveTables } from "@/lib/liveTables";
import { db } from "@/lib/db";
import WaiterHeader from "@/components/waiter/WaiterHeader";
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
      <WaiterHeader restaurantName={restaurant?.name ?? "Restaurant"} active="tables" />

      <main className="mx-auto max-w-3xl p-4">
        <WaiterAlertBoard initialTables={tables} />
      </main>
    </div>
  );
}
