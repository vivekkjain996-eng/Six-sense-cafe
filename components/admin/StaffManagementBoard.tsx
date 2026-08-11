"use client";

import { useState } from "react";

interface StaffView {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function StaffManagementBoard({ initialStaff }: { initialStaff: StaffView[] }) {
  const [staff, setStaff] = useState(initialStaff);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<{ email: string; password: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/staff");
    if (res.ok) setStaff(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setCreating(false);

    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not create waiter account");
      return;
    }

    setJustCreated({ email, password });
    setName("");
    setEmail("");
    setPassword("");
    await refresh();
  }

  async function handleRemove(id: string) {
    if (!window.confirm("Remove this waiter account? They will no longer be able to log in.")) return;
    setRemovingId(id);
    const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    setRemovingId(null);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not remove staff account");
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {justCreated && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          Waiter account created. Share these with staff — this password won&apos;t be shown again:
          <div className="mt-2 rounded-md bg-white p-3 font-mono text-sm">
            <p>Login: /waiter/login</p>
            <p>Email: {justCreated.email}</p>
            <p>Password: {justCreated.password}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Add a waiter account</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            required
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            minLength={6}
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create waiter account"}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">Waiter accounts</h2>
        {staff.length === 0 && (
          <p className="text-sm text-gray-500">No waiter accounts yet — add one above.</p>
        )}
        {staff.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div>
              <p className="font-medium text-slate-900">{s.name}</p>
              <p className="text-sm text-slate-500">{s.email}</p>
            </div>
            <button
              onClick={() => handleRemove(s.id)}
              disabled={removingId === s.id}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
