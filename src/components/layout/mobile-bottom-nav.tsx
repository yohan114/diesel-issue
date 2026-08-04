"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";

export function MobileBottomNav() {
  const pathname = usePathname();
  const items = NAV.filter((i) => i.mobile);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-amber-600" : "text-slate-500")}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate">{item.label.replace("Fuel ", "")}</span>
          </Link>
        );
      })}
    </nav>
  );
}
