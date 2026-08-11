import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getLiveTables } from "@/lib/liveTables";
import { db } from "@/lib/db";
import AdminHeader from "@/components/admin/AdminHeader";
import CreateTableForm from "@/components/admin/CreateTableForm";
import LiveOrdersBoard from "@/components/admin/LiveOrdersBoard";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session!.role === "WAITER") {
    redirect("/waiter");
  }

  const [tables, restaurant] = await Promise.all([
    getLiveTables(session!.restaurantId),
    db.restaurant.findUnique({ where: { id: session!.restaurantId } }),
  ]);

  return (
    <div className="min-h-screen">
      <AdminHeader restaurantName={restaurant?.name ?? "Restaurant"} active="dashboard" role={session!.role} />

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Tables & Live Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add a table below, then download its QR code and print it for that table. This
            list refreshes automatically as orders come in.
          </p>
        </div>

        <CreateTableForm />

        <LiveOrdersBoard initialTables={tables} />
      </main>
    </div>
  );
}
