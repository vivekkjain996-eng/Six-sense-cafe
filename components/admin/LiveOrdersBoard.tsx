"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LiveTable } from "@/lib/liveTables";
import { formatISTTime } from "@/lib/time";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Order received",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

const ALL_STATUSES = ["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"];

const POLL_INTERVAL_MS = 5000;

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

export default function LiveOrdersBoard({ initialTables }: { initialTables: LiveTable[] }) {
  const [tables, setTables] = useState<LiveTable[]>(initialTables);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [tableFilter, setTableFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Keep in sync if the server re-renders this page with fresh data
  // (e.g. right after adding a new table).
  useEffect(() => {
    setTables(initialTables);
  }, [initialTables]);

  async function refreshTables() {
    const res = await fetch("/api/admin/tables/live");
    if (res.ok) {
      setTables(await res.json());
    }
  }

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(() => {
      if (!cancelled) refreshTables();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function handleStatusChange(orderId: string, status: string) {
    setSavingOrderId(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSavingOrderId(null);
    if (res.ok) {
      await refreshTables();
    }
  }

  async function handleAcknowledgeWaiterCall(sessionId: string) {
    const res = await fetch(`/api/admin/sessions/${sessionId}/waiter-call`, {
      method: "DELETE",
    });
    if (res.ok) {
      await refreshTables();
    }
  }

  const pendingCount = tables.reduce(
    (n, t) => n + (t.session?.orders.filter((o) => o.status === "PENDING").length ?? 0),
    0,
  );

  const waiterCallTables = tables.filter((t) => t.session?.waiterCallRequestedAt);

  const visibleTables = tables.filter(
    (t) => tableFilter === "ALL" || String(t.tableNumber) === tableFilter,
  );

  return (
    <>
      {waiterCallTables.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-300 bg-gradient-to-r from-red-50 to-rose-50 p-4 shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
          </span>
          <p className="text-sm font-semibold text-red-900">
            Table{waiterCallTables.length > 1 ? "s" : ""}{" "}
            {waiterCallTables.map((t) => t.tableNumber).join(", ")} calling for a waiter
          </p>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
          </span>
          <p className="text-sm font-semibold text-amber-900">
            {pendingCount} new order{pendingCount > 1 ? "s" : ""} waiting
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          Table
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All</option>
            {tables.map((t) => (
              <option key={t.id} value={String(t.tableNumber)}>
                Table {t.tableNumber}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          Order status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTables.map((table) => {
          const session = table.session;
          const allOrders = session?.orders ?? [];
          const filteredOrders =
            statusFilter === "ALL" ? allOrders : allOrders.filter((o) => o.status === statusFilter);
          const hasPending = allOrders.some((o) => o.status === "PENDING");
          const isCallingWaiter = Boolean(session?.waiterCallRequestedAt);

          // When filtering by status across all tables, hide tables with no
          // matches instead of showing empty cards. A specific table filter
          // always shows that table, even with nothing matching.
          if (tableFilter === "ALL" && statusFilter !== "ALL" && filteredOrders.length === 0) {
            return null;
          }

          return (
            <div
              key={table.id}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                isCallingWaiter
                  ? "animate-pulse border-red-400 ring-2 ring-red-200"
                  : hasPending
                    ? "border-amber-300 ring-2 ring-amber-100"
                    : "border-slate-200"
              }`}
            >
              <div
                className={`h-1.5 w-full ${
                  isCallingWaiter
                    ? "bg-gradient-to-r from-red-500 to-rose-500"
                    : table.status === "OCCUPIED"
                      ? "bg-gradient-to-r from-amber-400 to-orange-400"
                      : "bg-gradient-to-r from-green-400 to-emerald-400"
                }`}
              />

              {isCallingWaiter && session && (
                <div className="flex items-center justify-between gap-2 bg-red-50 px-4 py-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-red-700">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                    </span>
                    Waiter called
                  </span>
                  <button
                    onClick={() => handleAcknowledgeWaiterCall(session.id)}
                    className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                  >
                    Acknowledge
                  </button>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    Table {table.tableNumber}
                    {hasPending && (
                      <span className="relative flex h-2.5 w-2.5" title="New order waiting">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                      </span>
                    )}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      table.status === "OCCUPIED"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                {session ? (
                  <>
                    <div className="mt-3 space-y-2">
                      {filteredOrders.length === 0 && (
                        <p className="text-sm text-gray-500">
                          {allOrders.length === 0
                            ? "No orders placed yet."
                            : "No orders match this filter."}
                        </p>
                      )}
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className={`rounded-lg border-l-4 bg-slate-50 p-2.5 ${statusAccentClass(order.status)}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-500">
                              {formatISTTime(order.placedAt)}
                            </span>
                            <select
                              value={order.status}
                              disabled={savingOrderId === order.id}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`rounded-full border-none px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(order.status)}`}
                            >
                              {ALL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABEL[s]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="mt-1.5 text-sm text-slate-700">
                            {order.items.map((i) => `${i.quantity}x ${i.itemNameSnapshot}`).join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-lg font-bold text-slate-900">
                        ₹{session.grandTotal.toFixed(2)}
                      </span>
                      <Link
                        href={`/admin/billing/${session.id}`}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                      >
                        View / Print Bill
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No active bill</p>
                )}

                <a
                  href={`/api/admin/tables/${table.id}/qrcode`}
                  className="mt-3 inline-block text-sm font-medium text-slate-500 underline hover:text-slate-700"
                >
                  Download QR code
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {tables.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-gray-600">
          No tables yet — add your first one above.
        </p>
      )}
    </>
  );
}
