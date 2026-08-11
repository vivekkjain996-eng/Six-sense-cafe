import { resolveTableSession } from "@/lib/tableSession";
import { db } from "@/lib/db";
import OrderingClient from "@/components/customer/OrderingClient";

export default async function CustomerMenuPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;
  const resolved = await resolveTableSession(qrToken);

  if (!resolved) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-white">QR code not recognized</h1>
          <p className="mt-2 text-neutral-400">
            This link doesn&apos;t match any table. Please ask staff for a fresh QR code.
          </p>
        </div>
      </main>
    );
  }

  const { restaurant, table, session } = resolved;

  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id },
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
  });

  return (
    <main className="min-h-screen bg-amber-50/40 pb-28">
      <header className="bg-gradient-to-br from-neutral-950 via-stone-900 to-neutral-950 px-5 py-6 text-center shadow-lg">
        <h1 className="text-2xl font-bold tracking-wide text-amber-400">{restaurant.name}</h1>
        <p className="mt-1 inline-block rounded-full bg-white/10 px-3 py-1 text-sm text-neutral-200">
          Table {table.tableNumber}
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="p-6 text-center text-gray-600">The menu hasn&apos;t been set up yet.</p>
      ) : (
        <OrderingClient sessionId={session.id} categories={categories} />
      )}
    </main>
  );
}
