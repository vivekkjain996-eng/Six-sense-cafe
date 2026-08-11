"use client";

import { useState } from "react";

interface MenuItemView {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
}

interface CategoryView {
  id: string;
  name: string;
  menuItems: MenuItemView[];
}

export default function WaiterMenuBoard({ initialCategories }: { initialCategories: CategoryView[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleAvailable(item: MenuItemView) {
    setBusyItemId(item.id);
    setError(null);

    const res = await fetch(`/api/admin/menu-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });

    setBusyItemId(null);

    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not update item");
      return;
    }

    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        menuItems: c.menuItems.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)),
      })),
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {categories.map((category) => (
        <section key={category.id}>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">{category.name}</h2>
          <div className="space-y-2">
            {category.menuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-label={item.isVeg ? "Veg" : "Non-veg"}
                    className={`inline-block h-3 w-3 flex-shrink-0 rounded-sm border-2 ${
                      item.isVeg ? "border-green-600" : "border-red-600"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleAvailable(item)}
                  disabled={busyItemId === item.id}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                    item.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </button>
              </div>
            ))}
            {category.menuItems.length === 0 && (
              <p className="text-sm text-gray-500">No items in this category.</p>
            )}
          </div>
        </section>
      ))}

      {categories.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-gray-600">
          No menu set up yet.
        </p>
      )}
    </div>
  );
}
