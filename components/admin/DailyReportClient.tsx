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
  date: string;
  total: number;
  byMethod: Record<string, number>;
  bills: Bill[];
}

const METHOD_LABEL: Record<string, string> = { CASH: "Cash", CARD: "Card", ONLINE: "Online" };

export default function DailyReportClient({ initialData }: { initialData: ReportData }) {
  const [data, setData] = useState<ReportData>(initialData);
  const [date, setDate] = useState(initialData.date);
  const [loading, setLoading] = useState(false);

  async function loadDate(newDate: string) {
    setDate(newDate);
    setLoading(true);
    const res = await fetch(`/api/admin/reports/daily?date=${newDate}`);
    setLoading(false);
    if (res.ok) {
      setData(await res.json());
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">
          Date{" "}
          <input
            type="date"
            value={date}
            onChange={(e) => loadDate(e.target.value)}
            className="ml-2 rounded-md border border-slate-300 px-3 py-1.5"
          />
        </label>
        {loading && <span className="text-sm text-slate-500">Loading...</span>}
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
                <td className="px-4 py-2 text-slate-600">
                  {new Date(bill.closedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </td>
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
          <p className="p-6 text-center text-sm text-slate-500">No bills closed on this day.</p>
        )}
      </div>
    </div>
  );
}
