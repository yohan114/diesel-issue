import Link from "next/link";
import { Fuel } from "lucide-react";
import type { CurrentUser } from "@/lib/rbac";
import { SidebarNav } from "./sidebar-nav";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { UserMenu } from "./user-menu";

export function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const isAdmin = user.role === "ADMIN";
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-slate-900 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-4 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
            <Fuel className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold">FleetFuel</span>
        </Link>
        <SidebarNav isAdmin={isAdmin} />
        <div className="px-5 py-3 text-xs text-slate-500">E&amp;C Fleet · LKR</div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
              <Fuel className="h-4 w-4" />
            </span>
            <span className="font-semibold text-slate-900">FleetFuel</span>
          </Link>
          <div className="hidden lg:block" />
          <UserMenu name={user.name} role={user.role} />
        </header>

        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 lg:pb-8">{children}</main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
