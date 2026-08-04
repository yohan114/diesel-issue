"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV, ADMIN_NAV } from "./nav";

function NavLink({ href, label, Icon, active }: { href: string; label: string; Icon: React.ComponentType<{ className?: string }>; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white",
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      {label}
    </Link>
  );
}

export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV.map((item) => (
        <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} active={isActive(item.href)} />
      ))}
      {isAdmin && (
        <>
          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Administration</p>
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} active={isActive(item.href)} />
          ))}
        </>
      )}
    </nav>
  );
}
