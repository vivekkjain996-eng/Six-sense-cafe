import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminHeader from "@/components/admin/AdminHeader";
import StaffManagementBoard from "@/components/admin/StaffManagementBoard";

export default async function AdminStaffPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session!.role === "WAITER") {
    redirect("/waiter");
  }
  if (session!.role !== "OWNER") {
    redirect("/admin/dashboard");
  }

  const [staff, restaurant] = await Promise.all([
    db.adminUser.findMany({
      where: { restaurantId: session!.restaurantId, role: "WAITER" },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    db.restaurant.findUnique({ where: { id: session!.restaurantId } }),
  ]);

  return (
    <div className="min-h-screen">
      <AdminHeader restaurantName={restaurant?.name ?? "Restaurant"} active="staff" role={session!.role} />

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Waiter Staff</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a login for each waiter so they can use their own phone at{" "}
            <span className="font-mono">/waiter/login</span> without ever seeing your admin
            credentials. They can view live tables, get alerted when called, update order
            status, and mark menu items unavailable — nothing else.
          </p>
        </div>

        <StaffManagementBoard
          initialStaff={staff.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
        />
      </main>
    </div>
  );
}
