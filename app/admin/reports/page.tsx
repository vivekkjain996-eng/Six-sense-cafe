import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEarningsReport, localDateString } from "@/lib/dailyReport";
import AdminHeader from "@/components/admin/AdminHeader";
import DailyReportClient from "@/components/admin/DailyReportClient";
import ClearDataButton from "@/components/admin/ClearDataButton";

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
    getEarningsReport(session!.restaurantId, today, today),
    db.restaurant.findUnique({ where: { id: session!.restaurantId } }),
  ]);

  return (
    <div className="min-h-screen">
      <AdminHeader restaurantName={restaurant?.name ?? "Restaurant"} active="reports" role={session!.role} />

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Daily Earnings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track how much you earned over any date range, and how customers paid (cash, card,
            or online).
          </p>
        </div>

        <DailyReportClient initialData={report} />

        {session!.role === "OWNER" && (
          <div className="mt-10 border-t border-slate-200 pt-6">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Danger Zone</h2>
            <ClearDataButton />
          </div>
        )}
      </main>
    </div>
  );
}
