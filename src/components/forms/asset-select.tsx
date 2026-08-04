"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { inputClasses } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type AssetOption = { id: string; code: string; category: string; meterType: "KM" | "HOURS" };

export function AssetSelect({
  assets,
  value,
  onChange,
  name = "assetId",
  placeholder = "Search asset code or type…",
}: {
  assets: AssetOption[];
  value: string;
  onChange: (a: AssetOption) => void;
  name?: string;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = assets.find((a) => a.id === value) ?? null;

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return assets.slice(0, 40);
    return assets.filter((a) => a.code.toLowerCase().includes(t) || a.category.toLowerCase().includes(t)).slice(0, 40);
  }, [q, assets]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <input
        className={inputClasses}
        placeholder={placeholder}
        value={open ? q : selected ? `${selected.code} · ${selected.category}` : q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQ("");
        }}
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">No matches</p>
          ) : (
            matches.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => {
                  onChange(a);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-amber-50",
                  a.id === value && "bg-amber-50",
                )}
              >
                <span className="font-medium text-slate-800">{a.code}</span>
                <span className="text-xs text-slate-500">
                  {a.category} · {a.meterType === "KM" ? "km" : "hrs"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
