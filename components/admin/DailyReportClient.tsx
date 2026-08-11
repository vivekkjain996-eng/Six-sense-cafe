"use client";

import { useState } from "react";

interface Bill {
  id: string;
  tableNumber: number;
  closedAt: string;
  grandTotal: number;
  paymentMethod: string | null;
}

interface ReportData {
  from: string;
  to: string;
  total: number;
  byMethod: Record<string, number>;
  bills: Bill[];
}

const METHOD_LABEL: Record<string, string> = { CASH: "Cash", CARD: "Card", ONLINE: "Online" };

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function DailyReportClient({ initialData }: { initialData: ReportData }) {
  const [data, setData] = useState<ReportData>(initialData);
  const [from, setFrom] = useState(initialData.from);
  const [to, setTo] = useState(initialData.to);
  const [loading, setLoading] = useState(false);

  async function loadRange(newFrom: string, newTo: string) {
    setFrom(newFrom);
    setTo(newTo);
    setLoading(true);
    const res = await fetch(`/api/admin/reports/daily?from=${newFrom}&to=${newTo}`);
    setLoading(false);
    if (res.ok) {
      setData(await res.json());
    }
  }

  function downloadCsv() {
    const rows = [
      ["Table", "Closed At", "Payment Method", "Amount"],
      ...data.bills.map((bill) => [
        `Table ${bill.tableNumber}`,
        new Date(bill.closedAt).toLocaleString(),
        bill.paymentMethod ? METHOD_LABEL[bill.paymentMethod] ?? bill.paymentMethod : "-",
        bill.grandTotal.toFixed(2),
      ]),
      [],
      ["Total", "", "", data.total.toFixed(2)],
      ["Cash", "", "", data.byMethod.CASH.toFixed(2)],
      ["Card", "", "", data.byMethod.CARD.toFixed(2)],
      ["Online", "", "", data.byMethod.ONLINE.toFixed(2)],
    ];

    const csv = rows.map((row) => row.map((cell) => csvCell(String(cell))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium text-slate-700">
          From
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => loadRange(e.target.value, to)}
            className="ml-2 rounded-md border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          To
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => loadRange(from, e.target.value)}
            className="ml-2 rounded-md border border-slate-300 px-3 py-1.5"
          />
        </label>
        {loading && <span className="text-sm text-slate-500">Loading...</span>}
        <button
          onClick={downloadCsv}
          disabled={data.bills.length === 0}
          className="ml-auto rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
        >
          📥 Download CSV
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Earned</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">₹{data.total.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Cash</p>
          <p className="mt-1 text-2xl font-bold text-green-700">₹{data.byMethod.CASH.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Card</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">₹{data.byMethod.CARD.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Online</p>
          <p className="mt-1 text-2xl font-bold text-purple-700">₹{data.byMethod.ONLINE.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Table</th>
              <th className="px-4 py-2 font-medium">Closed At</th>
              <th className="px-4 py-2 font-medium">Payment</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.bills.map((bill) => (
              <tr key={bill.id}>
                <td className="px-4 py-2 font-medium text-slate-800">Table {bill.tableNumber}</td>
                <td className="px-4 py-2 text-slate-600">{new Date(bill.closedAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-600">
                  {bill.paymentMethod ? METHOD_LABEL[bill.paymentMethod] ?? bill.paymentMethod : "—"}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-slate-900">
                  ₹{bill.grandTotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.bills.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">No bills closed in this range.</p>
        )}
      </div>
    </div>
  );
}
