import { FileSpreadsheet, FileText, Droplets, Wallet, Hash, Gauge } from "lucide-react";
import { db } from "@/lib/db";
import { monthlyReport, trend } from "@/lib/reports/aggregate";
import { currentYearMonth, monthLabel, MONTH_NAMES, formatNumber } from "@/lib/utils";
import { formatLKR } from "@/lib/money";
import { FUEL_LABELS, FUEL_SHORT, METER_UNIT, efficiencyLabelFromMeter, type FuelKind, type MeterType } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, Th, Tr, Td, TableScroll, EmptyRow } from "@/components/ui/table";
import { inputClasses } from "@/components/ui/field";
import { buttonClasses } from "@/components/ui/button";
import { ConsumptionStackedChart } from "@/components/charts/consumption-stacked-chart";
import { FuelSplitChart } from "@/components/charts/fuel-split-chart";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { PrintButton } from "@/components/reports/print-button";

export const dynamic = "force-dynamic";

type SP = { year?: string; month?: string; fuel?: string; category?: string };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const cur = currentYearMonth();
  const year = Number(sp.year) || cur.year;
  const month = Number(sp.month) || cur.month;
  const fuel = (sp.fuel as FuelKind | "") || "";
  const category = sp.category || "";

  const [report, series, categories] = await Promise.all([
    monthlyReport(year, month, { fuelKind: fuel || undefined, categoryId: category || undefined }),
    trend(6),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const avgPrice = report.totals.litres > 0 ? Math.round(report.totals.cost / report.totals.litres) : 0;
  const years = [cur.year, cur.year - 1, cur.year - 2];

  const qs = new URLSearchParams();
  qs.set("year", String(year));
  qs.set("month", String(month));
  if (fuel) qs.set("fuel", fuel);
  if (category) qs.set("category", category);
  const exportQs = qs.toString();

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle="Monthly fuel summary with charts, costed in LKR.">
        <a href={`/api/reports/export.xlsx?${exportQs}`} className={buttonClasses("outline", "sm")}>
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </a>
        <a href={`/api/reports/export.csv?${exportQs}`} className={buttonClasses("outline", "sm")}>
          <FileText className="h-4 w-4" /> CSV
        </a>
        <PrintButton />
      </PageHeader>

      <Card className="no-print">
        <CardContent>
          <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select name="month" defaultValue={month} className={inputClasses}>
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select name="year" defaultValue={year} className={inputClasses}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select name="fuel" defaultValue={fuel} className={inputClasses}>
              <option value="">All fuel types</option>
              {(Object.keys(FUEL_LABELS) as FuelKind[]).map((k) => (
                <option key={k} value={k}>{FUEL_LABELS[k]}</option>
              ))}
            </select>
            <select name="category" defaultValue={category} className={inputClasses}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className={buttonClasses("primary", "md")}>Apply</button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-5 print-full">
        <div className="hidden print:block">
          <h2 className="text-lg font-bold">Fleet Fuel — Monthly Report · {monthLabel(year, month)}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={`Litres · ${monthLabel(year, month)}`} value={`${formatNumber(Math.round(report.totals.litres))} L`} icon={Droplets} tone="amber" />
          <StatCard label="Total cost" value={formatLKR(report.totals.cost)} icon={Wallet} tone="emerald" />
          <StatCard label="Issues" value={report.totals.count} icon={Hash} tone="indigo" />
          <StatCard label="Avg price" value={avgPrice ? `${formatLKR(avgPrice)}/L` : "—"} icon={Gauge} tone="slate" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Consumption by fuel — last 6 months</CardTitle></CardHeader>
            <CardContent><ConsumptionStackedChart data={series} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Fuel split · {monthLabel(year, month)}</CardTitle></CardHeader>
            <CardContent><FuelSplitChart data={report.fuel} /></CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Cost by category</CardTitle></CardHeader>
            <CardContent><CategoryBarChart data={report.categories} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>By fuel type</CardTitle></CardHeader>
            <CardContent className="p-0">
              <TableScroll>
                <Table className="min-w-[420px]">
                  <THead>
                    <tr><Th>Fuel</Th><Th className="text-right">Litres</Th><Th className="text-right">Cost</Th><Th className="text-right">Issues</Th></tr>
                  </THead>
                  <tbody>
                    {report.fuel.map((f) => (
                      <Tr key={f.fuelKind}>
                        <Td><Badge tone={f.fuelKind === "SUPER_DIESEL" ? "violet" : "amber"}>{FUEL_SHORT[f.fuelKind as FuelKind]}</Badge></Td>
                        <Td className="text-right">{formatNumber(Math.round(f.litres))}</Td>
                        <Td className="text-right font-medium text-slate-900">{formatLKR(f.cost)}</Td>
                        <Td className="text-right text-slate-500">{f.count}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroll>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>By asset · {monthLabel(year, month)}</CardTitle>
            <span className="text-xs text-slate-500">{report.assets.length} fuelled</span>
          </CardHeader>
          <CardContent className="p-0">
            <TableScroll>
              <Table className="min-w-[720px]">
                <THead>
                  <tr>
                    <Th>Code</Th><Th>Category</Th>
                    <Th className="text-right">Litres</Th><Th className="text-right">Cost</Th>
                    <Th className="text-right">Running</Th><Th className="text-right">Efficiency</Th>
                  </tr>
                </THead>
                <tbody>
                  {report.assets.length === 0 ? (
                    <EmptyRow colSpan={6}>No fuel issued in this period.</EmptyRow>
                  ) : (
                    report.assets.map((a) => (
                      <Tr key={a.assetId}>
                        <Td className="font-medium text-slate-900">{a.code}</Td>
                        <Td className="text-slate-500">{a.category}</Td>
                        <Td className="text-right">{formatNumber(Math.round(a.litres))}</Td>
                        <Td className="text-right font-medium text-slate-900">{formatLKR(a.cost)}</Td>
                        <Td className="text-right text-slate-500">{a.running != null ? `${formatNumber(a.running)} ${METER_UNIT[a.meterType as MeterType]}` : "—"}</Td>
                        <Td className="text-right text-slate-500">{a.efficiency != null ? `${formatNumber(a.efficiency, 1)} ${efficiencyLabelFromMeter(a.meterType as MeterType)}` : "—"}</Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableScroll>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
