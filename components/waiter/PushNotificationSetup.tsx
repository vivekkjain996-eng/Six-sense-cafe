"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "unsupported" | "ios-needs-install" | "idle" | "enabling" | "enabled" | "denied" | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationSetup() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (isIos && !isStandalone) {
      setStatus("ios-needs-install");
      return;
    }

    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      setStatus(existing ? "enabled" : "idle");
    });
  }, []);

  async function enable() {
    setStatus("enabling");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      const keyRes = await fetch("/api/push/public-key");
      const { publicKey } = await keyRes.json();

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = subscription.toJSON();
      await fetch("/api/waiter/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });

      setStatus("enabled");
    } catch {
      setStatus("error");
    }
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="mb-4 rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
        This browser doesn&apos;t support background alerts. You&apos;ll still get the in-page beep
        while this tab is open.
      </p>
    );
  }

  if (status === "ios-needs-install") {
    return (
      <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        To get alerts with your screen locked: tap the Share button in Safari → <b>Add to Home
        Screen</b> → then open the app from your home screen and come back to this button. (Note:
        iPhone notifications play a sound but can&apos;t vibrate — that&apos;s an Apple limitation.)
      </p>
    );
  }

  if (status === "enabled") {
    return (
      <p className="mb-4 rounded-xl border border-green-300 bg-green-50 p-3 text-sm font-medium text-green-800">
        ✅ Background alerts enabled — you&apos;ll get notified even if this tab is closed or your
        phone is locked.
      </p>
    );
  }

  return (
    <div className="mb-4 space-y-2">
      <button
        onClick={enable}
        disabled={status === "enabling"}
        className="w-full rounded-xl bg-stone-900 px-4 py-3 text-base font-semibold text-amber-400 shadow-md transition hover:bg-stone-800 disabled:opacity-50"
      >
        {status === "enabling" ? "Enabling..." : "📳 Enable background alerts (works when locked)"}
      </button>
      {status === "denied" && (
        <p className="text-sm text-red-600">
          Notifications were blocked. Enable them for this site in your phone&apos;s browser
          settings, then reload this page.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">Something went wrong enabling alerts. Try again.</p>
      )}
    </div>
  );
}
