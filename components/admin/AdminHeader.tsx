import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

export default function AdminHeader({
  restaurantName,
  active,
  role,
}: {
  restaurantName: string;
  active: "dashboard" | "menu" | "reports" | "staff";
  role?: string;
}) {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <p className="text-lg font-semibold text-white">{restaurantName}</p>
          <p className="text-xs text-slate-400">Admin Console</p>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/admin/dashboard"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active === "dashboard"
                ? "bg-white text-slate-900"
                : "text-slate-200 hover:bg-white/10"
            }`}
          >
            Tables & Orders
          </Link>
          <Link
            href="/admin/menu"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active === "menu" ? "bg-white text-slate-900" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            Menu
          </Link>
          <Link
            href="/admin/reports"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active === "reports" ? "bg-white text-slate-900" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            Reports
          </Link>
          {role === "OWNER" && (
            <Link
              href="/admin/staff"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active === "staff" ? "bg-white text-slate-900" : "text-slate-200 hover:bg-white/10"
              }`}
            >
              Staff
            </Link>
          )}
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
