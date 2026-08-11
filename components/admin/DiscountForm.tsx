"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const QUICK_OPTIONS = [5, 10, 15, 20];

export default function DiscountForm({
  sessionId,
  currentDiscountPercent,
}: {
  sessionId: string;
  currentDiscountPercent: number;
}) {
  const router = useRouter();
  const [customValue, setCustomValue] = useState(String(currentDiscountPercent || ""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function applyDiscount(discountPercent: number) {
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/admin/sessions/${sessionId}/discount`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discountPercent }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not apply discount");
      return;
    }

    setCustomValue(String(discountPercent || ""));
    router.refresh();
  }

  return (
    <div className="print:hidden">
      <p className="mb-2 text-sm font-medium text-slate-700">
        Discount{currentDiscountPercent > 0 ? ` (currently ${currentDiscountPercent}%)` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_OPTIONS.map((percent) => (
          <button
            key={percent}
            onClick={() => applyDiscount(percent)}
            disabled={submitting}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
              currentDiscountPercent === percent
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {percent}%
          </button>
        ))}

        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Custom %"
          className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <button
          onClick={() => applyDiscount(Number(customValue) || 0)}
          disabled={submitting}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          Apply
        </button>

        {currentDiscountPercent > 0 && (
          <button
            onClick={() => applyDiscount(0)}
            disabled={submitting}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
