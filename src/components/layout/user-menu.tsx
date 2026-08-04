"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { ADMIN_NAV } from "./nav";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function UserMenu({ name, role }: { name: string; role: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isAdmin = role === "ADMIN";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
          {initials(name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block font-medium leading-tight text-slate-800">{name}</span>
          <span className="block text-xs leading-tight text-slate-500">{isAdmin ? "Administrator" : "Operator"}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
            <p className="font-medium text-slate-800">{name}</p>
            <p className="text-xs text-slate-500">{isAdmin ? "Administrator" : "Operator"}</p>
          </div>
          {isAdmin && (
            <div className="py-1 lg:hidden">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <div className="my-1 border-t border-slate-100" />
            </div>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50")}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
