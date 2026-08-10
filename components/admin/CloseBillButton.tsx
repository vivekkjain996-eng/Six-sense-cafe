"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const METHODS: { value: "CASH" | "CARD" | "ONLINE"; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "ONLINE", label: "Online" },
];

export default function CloseBillButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [choosing, setChoosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChoose(paymentMethod: "CASH" | "CARD" | "ONLINE") {
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/admin/sessions/${sessionId}/close`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not close this bill");
      return;
    }

    router.push("/admin/dashboard");
  }

  if (!choosing) {
    return (
      <div className="print:hidden">
        <button
          onClick={() => setChoosing(true)}
          className="rounded bg-green-600 px-4 py-2 font-medium text-white"
        >
          Mark Paid & Close Table
        </button>
      </div>
    );
  }

  return (
    <div className="print:hidden">
      <p className="mb-2 text-sm font-medium text-slate-700">How was this bill paid?</p>
      <div className="flex flex-wrap gap-2">
        {METHODS.map((m) => (
          <button
            key={m.value}
            onClick={() => handleChoose(m.value)}
            disabled={submitting}
            className="rounded-md bg-green-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={() => setChoosing(false)}
          disabled={submitting}
          className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-600 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
