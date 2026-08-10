import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminHeader from "@/components/admin/AdminHeader";
import MenuManagementBoard from "@/components/admin/MenuManagementBoard";

export default async function AdminMenuPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [categories, restaurant] = await Promise.all([
    db.category.findMany({
      where: { restaurantId: session!.restaurantId },
      orderBy: { sortOrder: "asc" },
      include: {
        menuItems: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            isVeg: true,
            isAvailable: true,
            imageUrl: true,
          },
        },
      },
    }),
    db.restaurant.findUnique({ where: { id: session!.restaurantId } }),
  ]);

  return (
    <div className="min-h-screen">
      <AdminHeader restaurantName={restaurant?.name ?? "Restaurant"} active="menu" />

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Menu Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add, edit, or remove categories and items, and mark items unavailable when you
            run out. Customers see changes the next time they open or reload the menu — not
            instantly if they already have it open.
          </p>
        </div>

        <MenuManagementBoard initialCategories={categories} />
      </main>
    </div>
  );
}
