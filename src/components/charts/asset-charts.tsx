"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART } from "@/lib/colors";
import { formatNumber } from "@/lib/utils";

export function MonthlyRunningChart({
  data,
  unit,
}: {
  data: Array<{ label: string; running: number; litres: number }>;
  unit: "km" | "hrs";
}) {
  const runningName = unit === "km" ? "Distance (km)" : "Hours";
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="l" tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => formatNumber(v)} />
        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip formatter={(v, n) => [formatNumber(Number(v)) + (n === runningName ? ` ${unit}` : " L"), n]} />
        <Legend />
        <Bar yAxisId="l" dataKey="running" name={runningName} fill={CHART.litres} radius={[4, 4, 0, 0]} barSize={26} />
        <Line yAxisId="r" dataKey="litres" name="Litres" stroke={CHART.cost} strokeWidth={2.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function CumulativeReadingChart({
  data,
  unit,
}: {
  data: Array<{ date: string; value: number }>;
  unit: "km" | "hrs";
}) {
  if (data.length < 2) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">Not enough readings yet to chart.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART.axis }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip formatter={(v) => formatNumber(Number(v)) + " " + unit} />
        <Line dataKey="value" name={unit === "km" ? "Odometer" : "Hour-meter"} stroke="#6366f1" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
