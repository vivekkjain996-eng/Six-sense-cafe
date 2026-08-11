import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDailyReport, localDateString } from "@/lib/dailyReport";
import AdminHeader from "@/components/admin/AdminHeader";
import DailyReportClient from "@/components/admin/DailyReportClient";

export default async function AdminReportsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session!.role === "WAITER") {
    redirect("/waiter");
  }

  const today = localDateString(new Date());

  const [report, restaurant] = await Promise.all([
    getDailyReport(session!.restaurantId, today),
    db.restaurant.findUnique({ where: { id: session!.restaurantId } }),
  ]);

  return (
    <div className="min-h-screen">
      <AdminHeader restaurantName={restaurant?.name ?? "Restaurant"} active="reports" />

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Daily Earnings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track how much you earned each day, and how customers paid (cash, card, or
            online). Pick a different date to see past days.
          </p>
        </div>

        <DailyReportClient initialData={report} />
      </main>
    </div>
  );
}
