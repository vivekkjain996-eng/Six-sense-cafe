"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveTable } from "@/lib/liveTables";
import { playBellChime, playChangeChime } from "@/lib/bellSound";
import {
  forgetSoundAlertsEnabled,
  hasSoundAlertsEnabled,
  rememberSoundAlertsEnabled,
} from "@/lib/soundAlertPreference";

const POLL_INTERVAL_MS = 4000;
const REPEAT_BEEP_MS = 8000;

// Owns the call-alert sound end-to-end (not just the Tables board), so it
// has to live somewhere that stays mounted no matter which waiter/admin tab
// is open — render this once per protected page (Tables, Menu, etc.).
// Previously the sound logic lived inside WaiterAlertBoard/LiveOrdersBoard
// only, so it went silent the moment you navigated to the Menu tab, since
// that page never rendered those components at all.
export default function CallAlertListener() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const priorCallingIdsRef = useRef<Set<string>>(new Set());
  const priorChangeCallingIdsRef = useRef<Set<string>>(new Set());
  const hasWaiterCallRef = useRef(false);
  const hasChangeCallRef = useRef(false);

  function playChime() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    playBellChime(ctx, 1);
  }

  function playChangeAlert() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    playChangeChime(ctx, 1);
  }

  function enableSound() {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtxRef.current = new AudioCtx();
    setSoundEnabled(true);
    rememberSoundAlertsEnabled();
    playChime();
  }

  function disableSound() {
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setSoundEnabled(false);
    forgetSoundAlertsEnabled();
  }

  // A fresh page load (or a tab switch that remounts this component) has no
  // user gesture yet, so a newly created/resumed AudioContext stays silently
  // "suspended" — that's why sound previously only worked until the next
  // refresh. If this device already opted in, arm a context now and resume
  // it on the very first tap/click/keypress anywhere on the page, which is
  // the earliest gesture we're guaranteed to get.
  useEffect(() => {
    if (!hasSoundAlertsEnabled()) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;
    setSoundEnabled(true);

    const resume = () => {
      ctx.resume().catch(() => {});
    };
    document.addEventListener("pointerdown", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });
    return () => {
      document.removeEventListener("pointerdown", resume);
      document.removeEventListener("keydown", resume);
    };
  }, []);

  async function poll() {
    const res = await fetch("/api/admin/tables/live");
    if (!res.ok) return;
    const fresh: LiveTable[] = await res.json();

    const currentCallingIds = new Set(
      fresh.filter((t) => t.session?.waiterCallRequestedAt).map((t) => t.id),
    );
    const hasNewCall = [...currentCallingIds].some((id) => !priorCallingIdsRef.current.has(id));
    if (hasNewCall) playChime();
    priorCallingIdsRef.current = currentCallingIds;
    hasWaiterCallRef.current = currentCallingIds.size > 0;

    const currentChangeCallingIds = new Set(
      fresh.filter((t) => t.session?.changeCallRequestedAt).map((t) => t.id),
    );
    const hasNewChangeCall = [...currentChangeCallingIds].some(
      (id) => !priorChangeCallingIdsRef.current.has(id),
    );
    if (hasNewChangeCall) playChangeAlert();
    priorChangeCallingIdsRef.current = currentChangeCallingIds;
    hasChangeCallRef.current = currentChangeCallingIds.size > 0;
  }

  useEffect(() => {
    if (!soundEnabled) return;
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) return;
    const interval = setInterval(() => {
      if (hasWaiterCallRef.current) playChime();
      if (hasChangeCallRef.current) playChangeAlert();
    }, REPEAT_BEEP_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  if (soundEnabled) {
    return (
      <button
        onClick={disableSound}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
      >
        🔔 Alerts on — tap to mute
      </button>
    );
  }

  return (
    <button
      onClick={enableSound}
      className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-base font-semibold text-stone-900 shadow-md transition hover:bg-amber-400"
    >
      🔔 Tap to enable call alerts
    </button>
  );
}
