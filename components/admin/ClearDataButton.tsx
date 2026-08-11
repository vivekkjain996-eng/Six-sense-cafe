"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONFIRM_TEXT = "CLEAR";

export default function ClearDataButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClear() {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/reports/clear-data", { method: "POST" });

    setSubmitting(false);

    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not clear data");
      return;
    }

    setConfirming(false);
    setConfirmText("");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        Clear all test data
      </button>
    );
  }

  return (
    <div className="max-w-md space-y-3 rounded-xl border border-red-300 bg-red-50 p-4">
      <p className="text-sm text-red-800">
        This permanently deletes <b>every order and closed bill</b> for this restaurant — used to
        wipe test/dummy data before going live. Your tables, QR codes, menu, and staff logins are
        not affected. This cannot be undone.
      </p>
      <p className="text-sm font-medium text-red-800">
        Type <span className="font-mono">{CONFIRM_TEXT}</span> to confirm:
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="w-full rounded-md border border-red-300 px-3 py-2"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleClear}
          disabled={confirmText !== CONFIRM_TEXT || submitting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Clearing..." : "Permanently clear data"}
        </button>
        <button
          onClick={() => {
            setConfirming(false);
            setConfirmText("");
            setError(null);
          }}
          disabled={submitting}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
