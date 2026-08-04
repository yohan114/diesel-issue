"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { FUEL_COLORS } from "@/lib/colors";
import { FUEL_SHORT, type FuelKind } from "@/lib/enums";
import { formatNumber } from "@/lib/utils";

export function FuelSplitChart({ data }: { data: Array<{ fuelKind: FuelKind; litres: number }> }) {
  const pie = data
    .map((d) => ({ name: FUEL_SHORT[d.fuelKind], value: Math.round(d.litres), kind: d.fuelKind }))
    .filter((p) => p.value > 0);
  const total = pie.reduce((s, p) => s + p.value, 0);

  if (total === 0) {
    return <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">No fuel issued in this period</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={2}>
          {pie.map((p) => (
            <Cell key={p.kind} fill={FUEL_COLORS[p.kind]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatNumber(Number(v)) + " L"} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
