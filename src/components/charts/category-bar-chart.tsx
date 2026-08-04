"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { CATEGORY_PALETTE } from "@/lib/colors";
import { formatLKR, formatLKRCompact } from "@/lib/money";

export function CategoryBarChart({ data }: { data: Array<{ category: string; cost: number }> }) {
  const rows = data.slice(0, 8);
  if (!rows.length) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 42)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tickFormatter={(v) => formatLKRCompact(v)} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="category" width={130} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => formatLKR(Number(v))} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={20}>
          {rows.map((_, i) => (
            <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
