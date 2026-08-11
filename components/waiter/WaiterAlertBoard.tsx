"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveTable } from "@/lib/liveTables";
import { formatISTTime } from "@/lib/time";

const POLL_INTERVAL_MS = 4000;
const REPEAT_BEEP_MS = 8000;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Order received",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

const ALL_STATUSES = ["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"];

function statusBadgeClass(status: string) {
  if (status === "PENDING") return "bg-amber-100 text-amber-700";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "SERVED") return "bg-green-100 text-green-700";
  return "bg-blue-100 text-blue-700";
}

export default function WaiterAlertBoard({ initialTables }: { initialTables: LiveTable[] }) {
  const [tables, setTables] = useState<LiveTable[]>(initialTables);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const priorCallingIdsRef = useRef<Set<string>>(new Set());

  function playChime() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.35;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.22;
      osc.start(start);
      osc.stop(start + 0.18);
    });
  }

  function enableSound() {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtxRef.current = new AudioCtx();
    setSoundEnabled(true);
    playChime();
  }

  async function refreshTables() {
    const res = await fetch("/api/admin/tables/live");
    if (!res.ok) return;
    const fresh: LiveTable[] = await res.json();

    const currentCallingIds = new Set(
      fresh.filter((t) => t.session?.waiterCallRequestedAt).map((t) => t.id),
    );
    const hasNewCall = [...currentCallingIds].some((id) => !priorCallingIdsRef.current.has(id));
    if (hasNewCall && soundEnabled) {
      playChime();
    }
    priorCallingIdsRef.current = currentCallingIds;

    setTables(fresh);
  }

  useEffect(() => {
    setTables(initialTables);
    priorCallingIdsRef.current = new Set(
      initialTables.filter((t) => t.session?.waiterCallRequestedAt).map((t) => t.id),
    );
  }, [initialTables]);

  useEffect(() => {
    const interval = setInterval(refreshTables, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  const waiterCallTables = tables.filter((t) => t.session?.waiterCallRequestedAt);

  useEffect(() => {
    if (!soundEnabled || waiterCallTables.length === 0) return;
    const interval = setInterval(playChime, REPEAT_BEEP_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled, waiterCallTables.length]);

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

  async function handleAcknowledge(sessionId: string) {
    setAcknowledgingId(sessionId);
    const res = await fetch(`/api/admin/sessions/${sessionId}/waiter-call`, { method: "DELETE" });
    setAcknowledgingId(null);
    if (res.ok) {
      await refreshTables();
    }
  }

  return (
    <>
      {!soundEnabled && (
        <button
          onClick={enableSound}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-base font-semibold text-stone-900 shadow-md transition hover:bg-amber-400"
        >
          🔔 Tap to enable call alerts
        </button>
      )}

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

      <div className="space-y-4">
        {tables.map((table) => {
          const session = table.session;
          const orders = session?.orders ?? [];
          const hasPending = orders.some((o) => o.status === "PENDING");
          const isCallingWaiter = Boolean(session?.waiterCallRequestedAt);

          return (
            <div
              key={table.id}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
                isCallingWaiter
                  ? "animate-pulse border-red-400 ring-2 ring-red-200"
                  : hasPending
                    ? "border-amber-300 ring-2 ring-amber-100"
                    : "border-slate-200"
              }`}
            >
              {isCallingWaiter && session && (
                <div className="flex items-center justify-between gap-2 bg-red-50 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-red-700">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                    </span>
                    Waiter called
                  </span>
                  <button
                    onClick={() => handleAcknowledge(session.id)}
                    disabled={acknowledgingId === session.id}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
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
                  <div className="mt-3 space-y-2">
                    {orders.length === 0 && (
                      <p className="text-sm text-gray-500">No orders placed yet.</p>
                    )}
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-lg bg-slate-50 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">{formatISTTime(order.placedAt)}</span>
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
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No active bill</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tables.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-gray-600">
          No tables set up yet.
        </p>
      )}
    </>
  );
}
