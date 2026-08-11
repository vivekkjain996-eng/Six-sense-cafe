"use client";

import { useEffect, useState } from "react";

interface MenuItemView {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
}

interface CategoryView {
  id: string;
  name: string;
  menuItems: MenuItemView[];
}

interface OrderItemView {
  id: string;
  itemNameSnapshot: string;
  quantity: number;
  lineTotal: number;
}

interface OrderView {
  id: string;
  status: string;
  placedAt: string;
  items: OrderItemView[];
}

interface SessionSummary {
  id: string;
  grandTotal: number;
  orders: OrderView[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Order received",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

function statusBadgeClass(status: string) {
  if (status === "PENDING") return "bg-amber-100 text-amber-700";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "SERVED") return "bg-green-100 text-green-700";
  return "bg-blue-100 text-blue-700";
}

function statusAccentClass(status: string) {
  if (status === "PENDING") return "border-l-amber-400";
  if (status === "CANCELLED") return "border-l-red-400";
  if (status === "SERVED") return "border-l-green-400";
  return "border-l-blue-400";
}

export default function OrderingClient({
  sessionId,
  categories,
}: {
  sessionId: string;
  categories: CategoryView[];
}) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiterCallState, setWaiterCallState] = useState<"idle" | "sending" | "sent">("idle");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);

  const allItems = categories.flatMap((c) => c.menuItems);

  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSecondsLeft(secondsLeft);
      if (secondsLeft <= 0) {
        setCooldownUntil(null);
        setWaiterCallState("idle");
      }
    }, 500);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  async function callWaiter() {
    setWaiterCallState("sending");
    const res = await fetch(`/api/sessions/${sessionId}/waiter-call`, { method: "POST" });
    if (res.ok) {
      setWaiterCallState("sent");
      setCooldownUntil(Date.now() + 60_000);
    } else {
      setWaiterCallState("idle");
    }
  }

  async function loadSummary() {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.ok) {
      setSummary(await res.json());
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  function setQuantity(menuItemId: string, quantity: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[menuItemId];
      } else {
        next[menuItemId] = quantity;
      }
      return next;
    });
  }

  const cartEntries = Object.entries(cart);
  const cartTotal = cartEntries.reduce((sum, [menuItemId, qty]) => {
    const item = allItems.find((i) => i.id === menuItemId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  async function placeOrder() {
    if (cartEntries.length === 0) return;
    setPlacing(true);
    setError(null);

    const res = await fetch(`/api/sessions/${sessionId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartEntries.map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      }),
    });

    setPlacing(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not place order");
      return;
    }

    setCart({});
    await loadSummary();
  }

  return (
    <>
      <button
        onClick={callWaiter}
        disabled={waiterCallState !== "idle"}
        className={`fixed right-4 z-30 flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold shadow-xl transition disabled:cursor-not-allowed ${
          cartEntries.length > 0 ? "bottom-24" : "bottom-6"
        } ${
          waiterCallState === "sent"
            ? "bg-green-600 text-white"
            : "bg-stone-900 text-amber-400 hover:bg-stone-800"
        }`}
      >
        {waiterCallState === "sending" && "Calling..."}
        {waiterCallState === "sent" &&
          `✓ Waiter notified${cooldownSecondsLeft > 0 ? ` (${cooldownSecondsLeft}s)` : ""}`}
        {waiterCallState === "idle" && "🔔 Call Waiter"}
      </button>

      {summary && summary.orders.length > 0 && (
        <div className="sticky top-[124px] z-10 mx-4 mt-3 flex items-center justify-between rounded-xl bg-stone-900 px-4 py-2.5 shadow-md">
          <span className="text-sm text-amber-100">
            {summary.orders.length} order{summary.orders.length > 1 ? "s" : ""} on this bill
          </span>
          <span className="text-lg font-bold text-amber-400">₹{summary.grandTotal.toFixed(2)}</span>
        </div>
      )}

      <div className="mx-auto max-w-xl space-y-8 p-4">
        {summary && summary.orders.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1.5 rounded-full bg-amber-400" />
              <h2 className="text-lg font-bold text-stone-800">Your orders on this bill</h2>
            </div>
            <div className="space-y-3">
              {summary.orders.map((order) => (
                <div
                  key={order.id}
                  className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${statusAccentClass(order.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">
                      {order.items.map((i) => `${i.quantity}x ${i.itemNameSnapshot}`).join(", ")}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(order.status)}`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {categories.map((category) => (
          <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-32">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1.5 rounded-full bg-amber-400" />
              <h2 className="text-lg font-bold text-stone-800">{category.name}</h2>
            </div>
            <div className="space-y-3">
              {category.menuItems.map((item) => {
                const qty = cart[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between rounded-xl border bg-white p-4 shadow-sm transition ${
                      item.isAvailable
                        ? "border-stone-200 hover:shadow-md"
                        : "border-stone-100 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          aria-label={item.isVeg ? "Veg" : "Non-veg"}
                          className={`inline-block h-3 w-3 flex-shrink-0 rounded-sm border-2 ${
                            item.isVeg ? "border-green-600" : "border-red-600"
                          }`}
                        />
                        <h3 className="font-semibold text-stone-900">{item.name}</h3>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-stone-500">{item.description}</p>
                      )}
                      <p className="mt-1 font-bold text-amber-700">₹{item.price.toFixed(2)}</p>
                      {!item.isAvailable && (
                        <p className="mt-1 text-xs font-medium text-red-600">Currently unavailable</p>
                      )}
                    </div>

                    {item.isAvailable && (
                      <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 p-1">
                        <button
                          onClick={() => setQuantity(item.id, qty - 1)}
                          disabled={qty === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-bold text-amber-700 shadow-sm disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-semibold text-stone-800">{qty}</span>
                        <button
                          onClick={() => setQuantity(item.id, qty + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 font-bold text-white shadow-sm transition hover:bg-amber-600"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {cartEntries.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-amber-300 bg-gradient-to-r from-amber-500 to-orange-500 p-4 shadow-2xl">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <div className="text-white">
              <p className="text-sm opacity-90">
                {cartEntries.reduce((n, [, qty]) => n + qty, 0)} item(s)
              </p>
              <p className="text-lg font-bold">₹{cartTotal.toFixed(2)}</p>
            </div>
            {error && <p className="text-sm font-medium text-white">{error}</p>}
            <button
              onClick={placeOrder}
              disabled={placing}
              className="rounded-full bg-stone-900 px-6 py-2.5 font-semibold text-white shadow-lg transition hover:bg-stone-800 disabled:opacity-50"
            >
              {placing ? "Placing..." : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
