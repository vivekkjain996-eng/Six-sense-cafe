"use client";

import { useRouter } from "next/navigation";

export default function WaiterLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/waiter/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
    >
      Log out
    </button>
  );
}
