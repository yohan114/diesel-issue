"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CollapsibleCard({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 sm:px-5"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Plus className="h-4 w-4 text-amber-500" />
          {title}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-slate-100 p-4 sm:p-5">{children}</div>}
    </Card>
  );
}
