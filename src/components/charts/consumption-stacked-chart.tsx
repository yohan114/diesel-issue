"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { FUEL_COLORS, CHART } from "@/lib/colors";
import { formatNumber } from "@/lib/utils";

type Point = { label: string; autoDiesel: number; superDiesel: number };

export function ConsumptionStackedChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip formatter={(v) => formatNumber(Number(v)) + " L"} cursor={{ fill: "#f8fafc" }} />
        <Legend />
        <Bar dataKey="autoDiesel" stackId="f" name="Diesel" fill={FUEL_COLORS.AUTO_DIESEL} barSize={28} />
        <Bar dataKey="superDiesel" stackId="f" name="Super Diesel" fill={FUEL_COLORS.SUPER_DIESEL} radius={[4, 4, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
