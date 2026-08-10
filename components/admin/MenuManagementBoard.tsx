"use client";

import { useState } from "react";

interface MenuItemView {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl: string | null;
}

interface CategoryView {
  id: string;
  name: string;
  sortOrder: number;
  menuItems: MenuItemView[];
}

interface ItemFormState {
  name: string;
  description: string;
  price: string;
  isVeg: boolean;
  imageUrl: string;
}

const EMPTY_FORM: ItemFormState = { name: "", description: "", price: "", isVeg: true, imageUrl: "" };

export default function MenuManagementBoard({
  initialCategories,
}: {
  initialCategories: CategoryView[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [error, setError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [addItemCategoryId, setAddItemCategoryId] = useState<string | null>(null);
  const [addItemForm, setAddItemForm] = useState<ItemFormState>(EMPTY_FORM);
  const [savingNewItem, setSavingNewItem] = useState(false);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItemFormState>(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/menu-items");
    if (res.ok) setCategories(await res.json());
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAddingCategory(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });
    setAddingCategory(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not add category");
      return;
    }
    setNewCategoryName("");
    await refresh();
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete this category?")) return;
    setError(null);
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not delete category");
      return;
    }
    await refresh();
  }

  function startAddItem(categoryId: string) {
    setAddItemCategoryId(categoryId);
    setAddItemForm(EMPTY_FORM);
    setError(null);
  }

  async function submitNewItem(e: React.FormEvent) {
    e.preventDefault();
    if (!addItemCategoryId) return;
    setError(null);
    setSavingNewItem(true);

    const res = await fetch("/api/admin/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: addItemCategoryId,
        name: addItemForm.name,
        description: addItemForm.description || null,
        price: Number(addItemForm.price),
        isVeg: addItemForm.isVeg,
        imageUrl: addItemForm.imageUrl || null,
      }),
    });

    setSavingNewItem(false);

    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not add item");
      return;
    }

    setAddItemCategoryId(null);
    await refresh();
  }

  function startEdit(item: MenuItemView) {
    setEditingItemId(item.id);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      isVeg: item.isVeg,
      imageUrl: item.imageUrl ?? "",
    });
    setError(null);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItemId) return;
    setError(null);
    setSavingEdit(true);

    const res = await fetch(`/api/admin/menu-items/${editingItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        description: editForm.description || null,
        price: Number(editForm.price),
        isVeg: editForm.isVeg,
        imageUrl: editForm.imageUrl || null,
      }),
    });

    setSavingEdit(false);

    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save changes");
      return;
    }

    setEditingItemId(null);
    await refresh();
  }

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
    await refresh();
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this menu item?")) return;
    setBusyItemId(id);
    setError(null);
    const res = await fetch(`/api/admin/menu-items/${id}`, { method: "DELETE" });
    setBusyItemId(null);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not delete item");
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={addCategory} className="flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium">New category</label>
          <input
            type="text"
            required
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="mt-1 w-56 rounded border border-gray-300 px-3 py-2"
            placeholder="e.g. Desserts"
          />
        </div>
        <button
          type="submit"
          disabled={addingCategory}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {addingCategory ? "Adding..." : "Add Category"}
        </button>
      </form>

      {categories.map((category) => (
        <section key={category.id}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <div className="flex gap-3">
              <button
                onClick={() => startAddItem(category.id)}
                className="text-sm font-medium text-blue-600 underline"
              >
                + Add item
              </button>
              <button
                onClick={() => deleteCategory(category.id)}
                className="text-sm font-medium text-red-600 underline"
              >
                Delete category
              </button>
            </div>
          </div>

          {addItemCategoryId === category.id && (
            <form
              onSubmit={submitNewItem}
              className="mb-3 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Item name"
                  value={addItemForm.name}
                  onChange={(e) => setAddItemForm({ ...addItemForm, name: e.target.value })}
                  className="flex-1 rounded border border-gray-300 px-3 py-2"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Price"
                  value={addItemForm.price}
                  onChange={(e) => setAddItemForm({ ...addItemForm, price: e.target.value })}
                  className="w-28 rounded border border-gray-300 px-3 py-2"
                />
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={addItemForm.description}
                onChange={(e) => setAddItemForm({ ...addItemForm, description: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={addItemForm.imageUrl}
                onChange={(e) => setAddItemForm({ ...addItemForm, imageUrl: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addItemForm.isVeg}
                  onChange={(e) => setAddItemForm({ ...addItemForm, isVeg: e.target.checked })}
                />
                Vegetarian
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingNewItem}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {savingNewItem ? "Saving..." : "Save item"}
                </button>
                <button
                  type="button"
                  onClick={() => setAddItemCategoryId(null)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {category.menuItems.map((item) =>
              editingItemId === item.id ? (
                <form
                  key={item.id}
                  onSubmit={submitEdit}
                  className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="flex-1 rounded border border-gray-300 px-3 py-2"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="w-28 rounded border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Image URL (optional)"
                    value={editForm.imageUrl}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.isVeg}
                      onChange={(e) => setEditForm({ ...editForm, isVeg: e.target.checked })}
                    />
                    Vegetarian
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {savingEdit ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItemId(null)}
                      className="rounded border border-gray-300 px-4 py-2 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-label={item.isVeg ? "Veg" : "Non-veg"}
                      className={`inline-block h-3 w-3 rounded-sm border-2 ${
                        item.isVeg ? "border-green-600" : "border-red-600"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAvailable(item)}
                      disabled={busyItemId === item.id}
                      className={`rounded px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                        item.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={busyItemId === item.id}
                      className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ),
            )}

            {category.menuItems.length === 0 && addItemCategoryId !== category.id && (
              <p className="text-sm text-gray-500">No items in this category yet.</p>
            )}
          </div>
        </section>
      ))}

      {categories.length === 0 && (
        <p className="text-gray-600">No categories yet — add one above to get started.</p>
      )}
    </div>
  );
}
