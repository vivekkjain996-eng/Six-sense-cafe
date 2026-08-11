import Link from "next/link";
import WaiterLogoutButton from "@/components/waiter/WaiterLogoutButton";

export default function WaiterHeader({
  restaurantName,
  active,
}: {
  restaurantName: string;
  active: "tables" | "menu";
}) {
  return (
    <header className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 shadow-md">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-lg font-semibold text-white">{restaurantName}</p>
          <p className="text-xs text-amber-400">Waiter View</p>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/waiter"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active === "tables" ? "bg-white text-stone-900" : "text-stone-200 hover:bg-white/10"
            }`}
          >
            Tables
          </Link>
          <Link
            href="/waiter/menu"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active === "menu" ? "bg-white text-stone-900" : "text-stone-200 hover:bg-white/10"
            }`}
          >
            Menu
          </Link>
          <WaiterLogoutButton />
        </nav>
      </div>
    </header>
  );
}
