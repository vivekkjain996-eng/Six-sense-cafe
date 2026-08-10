import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import PrintButton from "@/components/admin/PrintButton";
import CloseBillButton from "@/components/admin/CloseBillButton";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Order received",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

export default async function BillPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    redirect("/admin/login");
  }

  const { sessionId } = await params;

  const session = await db.tableSession.findUnique({
    where: { id: sessionId },
    include: {
      table: { include: { restaurant: true } },
      orders: {
        orderBy: { placedAt: "asc" },
        include: { items: true },
      },
    },
  });

  if (!session || session.table.restaurantId !== adminSession!.restaurantId) {
    notFound();
  }

  const activeOrders = session.orders.filter((o) => o.status !== "CANCELLED");
  const allItems = activeOrders.flatMap((o) => o.items);

  return (
    <main className="mx-auto min-h-screen max-w-xl p-6">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/admin/dashboard"
          className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
        >
          ← Back to dashboard
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="border-b border-dashed border-slate-200 pb-4 text-center">
          <h1 className="text-xl font-bold text-slate-900">{session.table.restaurant.name}</h1>
          <p className="text-slate-600">Table {session.table.tableNumber}</p>
          <p className="mt-1 text-xs text-slate-400">
            Bill opened {session.openedAt.toLocaleString()}
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {activeOrders.map((order) => (
            <div key={order.id}>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{order.placedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                <span>{STATUS_LABEL[order.status] ?? order.status}</span>
              </div>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-1 text-slate-800">
                  <span>
                    {item.quantity}x {item.itemNameSnapshot}
                  </span>
                  <span>₹{item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))}

          {allItems.length === 0 && (
            <p className="text-sm text-gray-500">No orders placed on this bill yet.</p>
          )}
        </div>

        <div className="mt-6 space-y-1 border-t border-dashed border-slate-200 pt-4">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>₹{session.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Tax</span>
            <span>₹{session.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>Grand Total</span>
            <span>₹{session.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium">
          Payment status:{" "}
          <span className={session.paymentStatus === "PAID" ? "text-green-700" : "text-amber-700"}>
            {session.paymentStatus}
          </span>
          {session.status === "CLOSED" && " — bill closed"}
        </p>

        {session.status === "OPEN" && (
          <div className="mt-4">
            <CloseBillButton sessionId={session.id} />
          </div>
        )}
      </div>
    </main>
  );
}
