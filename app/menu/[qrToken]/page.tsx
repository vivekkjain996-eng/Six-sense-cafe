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
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-amber-50/40 pb-28">
      <header className="sticky top-0 z-20 bg-gradient-to-r from-neutral-950 via-stone-900 to-neutral-950 px-5 py-4 shadow-lg">
        <h1 className="text-xl font-bold tracking-wide text-amber-400">{restaurant.name}</h1>
        <p className="text-sm text-neutral-300">Table {table.tableNumber}</p>
      </header>

      {categories.length > 0 && (
        <nav className="sticky top-[68px] z-10 flex gap-2 overflow-x-auto border-b border-amber-200 bg-amber-50/95 px-4 py-2.5 backdrop-blur">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#cat-${category.id}`}
              className="flex-shrink-0 rounded-full border border-amber-300 bg-white px-3 py-1 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-amber-400 hover:text-white"
            >
              {category.name}
            </a>
          ))}
        </nav>
      )}

      {categories.length === 0 ? (
        <p className="p-6 text-center text-gray-600">The menu hasn&apos;t been set up yet.</p>
      ) : (
        <OrderingClient sessionId={session.id} categories={categories} />
      )}
    </main>
  );
}
