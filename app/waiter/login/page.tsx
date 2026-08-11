"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WaiterLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }

    router.push("/waiter");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-900 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-stone-700 bg-stone-800 p-6 shadow-xl"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-400">🔔 Waiter Login</h1>
          <p className="mt-1 text-sm text-stone-400">Sign in to receive table alerts</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-200">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-600 bg-stone-900 px-3 py-2.5 text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-200">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-600 bg-stone-900 px-3 py-2.5 text-white"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-amber-500 px-4 py-3 text-base font-semibold text-stone-900 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
