import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminHeader from "@/components/admin/AdminHeader";
import AccountSettingsForm from "@/components/admin/AccountSettingsForm";

export default async function AdminAccountPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session!.role === "WAITER") {
    redirect("/waiter");
  }

  const [admin, restaurant] = await Promise.all([
    db.adminUser.findUnique({ where: { id: session!.adminId }, select: { name: true, email: true } }),
    db.restaurant.findUnique({ where: { id: session!.restaurantId } }),
  ]);

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen">
      <AdminHeader restaurantName={restaurant?.name ?? "Restaurant"} active="account" role={session!.role} />

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update the email and password you use to log in. This does not affect waiter
            accounts — manage those from the Staff page.
          </p>
        </div>

        <AccountSettingsForm initialName={admin!.name} initialEmail={admin!.email} />
      </main>
    </div>
  );
}
