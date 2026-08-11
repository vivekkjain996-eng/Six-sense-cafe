import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import WaiterHeader from "@/components/waiter/WaiterHeader";
import WaiterMenuBoard from "@/components/waiter/WaiterMenuBoard";

export default async function WaiterMenuPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/waiter/login");
  }

  const [categories, restaurant] = await Promise.all([
    db.category.findMany({
      where: { restaurantId: session!.restaurantId },
      orderBy: { sortOrder: "asc" },
      include: {
        menuItems: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, price: true, isVeg: true, isAvailable: true },
        },
      },
    }),
    db.restaurant.findUnique({ where: { id: session!.restaurantId } }),
  ]);

  return (
    <div className="min-h-screen bg-stone-50">
      <WaiterHeader restaurantName={restaurant?.name ?? "Restaurant"} active="menu" />

      <main className="mx-auto max-w-3xl p-4">
        <p className="mb-4 text-sm text-gray-600">
          Mark an item unavailable the moment you run out — customers stop seeing it as
          orderable right away.
        </p>
        <WaiterMenuBoard initialCategories={categories} />
      </main>
    </div>
  );
}
