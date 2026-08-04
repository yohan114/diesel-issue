"use client";

import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CHART } from "@/lib/colors";
import { formatLKR, formatLKRCompact } from "@/lib/money";
import { formatNumber } from "@/lib/utils";

type Point = { label: string; litres: number; cost: number };

export function TrendChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="l" tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => formatNumber(v)} />
        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatLKRCompact(v)} />
        <Tooltip
          formatter={(value, name) =>
            name === "Cost" ? [formatLKR(Number(value)), "Cost"] : [formatNumber(Number(value)) + " L", "Litres"]
          }
        />
        <Legend />
        <Bar yAxisId="l" dataKey="litres" name="Litres" fill={CHART.litres} radius={[4, 4, 0, 0]} barSize={26} />
        <Line yAxisId="r" dataKey="cost" name="Cost" stroke={CHART.cost} strokeWidth={2.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
