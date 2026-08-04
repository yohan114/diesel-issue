import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Droplets, Wallet, Gauge, Activity } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { latestReading, assetMonthlyRunning, getRunning, getFuelTotals, efficiency, efficiencyLabel } from "@/lib/metering";
import { monthBounds, currentYearMonth, formatDate, formatNumber, monthLabel } from "@/lib/utils";
import { formatLKR } from "@/lib/money";
import { FUEL_SHORT, METER_UNIT, type FuelKind, type MeterType } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Table, THead, Th, Tr, Td, TableScroll, EmptyRow } from "@/components/ui/table";
import { AdminOnly } from "@/components/layout/role-gate";
import { CollapsibleCard } from "@/components/layout/collapsible-card";
import { MonthlyRunningChart, CumulativeReadingChart } from "@/components/charts/asset-charts";
import { AssetEditForm } from "@/components/forms/asset-edit-form";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();

  const asset = await db.asset.findUnique({ where: { id }, include: { category: true } });
  if (!asset) notFound();

  const meterType = asset.meterType as MeterType;
  const unit = METER_UNIT[meterType];
  const { year, month } = currentYearMonth();
  const { from, to } = monthBounds(year, month);

  const [lifetime, last, monthly, readings, issues, monthRunning, monthFuel] = await Promise.all([
    db.fuelIssue.aggregate({ _sum: { litres: true, totalCost: true }, _count: true, where: { assetId: id } }),
    latestReading(id, meterType),
    assetMonthlyRunning(id, meterType, 8),
    db.meterReading.findMany({ where: { assetId: id, readingType: meterType }, orderBy: { readingDate: "asc" }, take: 250, select: { value: true, readingDate: true } }),
    db.fuelIssue.findMany({ where: { assetId: id }, orderBy: { issueDate: "desc" }, take: 12, include: { issuedBy: { select: { name: true } } } }),
    getRunning(id, meterType, from, to),
    getFuelTotals(id, from, to),
  ]);

  const monthEff = efficiency(meterType, monthRunning, monthFuel.litres);

  const specs: Array<[string, string | number | null]> = [
    ["Brand", asset.brand],
    ["Model", asset.model],
    ["Registration", asset.regNo],
    ["Capacity", asset.capacity],
    ["Year", asset.yom],
    ["Chassis No.", asset.chassisNo],
    ["Engine No.", asset.engineNo],
    ["Serial No.", asset.serialNo],
    ["Site", asset.site],
  ];

  return (
    <div className="space-y-5">
      <Link href="/fleet" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to fleet
      </Link>

      <PageHeader title={asset.code} subtitle={`${asset.category.name} · ${asset.typeLabel ?? ""}`}>
        <Badge tone={(meterType as MeterType) === "KM" ? "blue" : "violet"}>{meterType === "KM" ? "Kilometres" : "Hours"}</Badge>
        <Badge tone={statusTone(asset.status)}>{asset.status}</Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Lifetime fuel" value={`${formatNumber(Math.round(lifetime._sum.litres ?? 0))} L`} sub={`${lifetime._count} issues`} icon={Droplets} tone="amber" />
        <StatCard label="Lifetime cost" value={formatLKR(lifetime._sum.totalCost ?? 0)} icon={Wallet} tone="emerald" />
        <StatCard label="Last reading" value={last ? `${formatNumber(last.value)} ${unit}` : "—"} sub={last ? formatDate(last.readingDate) : "no readings"} icon={Gauge} tone="indigo" />
        <StatCard
          label={`Running · ${monthLabel(year, month)}`}
          value={monthRunning != null ? `${formatNumber(monthRunning)} ${unit}` : "—"}
          sub={monthEff != null ? `${formatNumber(monthEff, 1)} ${efficiencyLabel(meterType)}` : "—"}
          icon={Activity}
          tone="slate"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Running & fuel · last 8 months</CardTitle></CardHeader>
          <CardContent><MonthlyRunningChart data={monthly} unit={unit} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{meterType === "KM" ? "Odometer" : "Hour-meter"} trend</CardTitle></CardHeader>
          <CardContent>
            <CumulativeReadingChart data={readings.map((r) => ({ date: formatDate(r.readingDate), value: r.value }))} unit={unit} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Specifications</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {specs.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="text-sm font-medium text-slate-800">{v ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent fuel issues</CardTitle></CardHeader>
        <CardContent className="p-0">
          <TableScroll>
            <Table className="min-w-[620px]">
              <THead>
                <tr>
                  <Th>Date</Th>
                  <Th>Fuel</Th>
                  <Th className="text-right">Litres</Th>
                  <Th className="text-right">Cost</Th>
                  <Th className="text-right">Reading</Th>
                  <Th>By</Th>
                </tr>
              </THead>
              <tbody>
                {issues.length === 0 ? (
                  <EmptyRow colSpan={6}>No fuel issued to this asset yet.</EmptyRow>
                ) : (
                  issues.map((r) => (
                    <Tr key={r.id}>
                      <Td>{formatDate(r.issueDate)}</Td>
                      <Td><Badge tone={r.fuelKind === "SUPER_DIESEL" ? "violet" : "amber"}>{FUEL_SHORT[r.fuelKind as FuelKind]}</Badge></Td>
                      <Td className="text-right">{formatNumber(r.litres, 1)}</Td>
                      <Td className="text-right font-medium text-slate-900">{formatLKR(r.totalCost)}</Td>
                      <Td className="text-right text-slate-500">{r.meterReading != null ? `${formatNumber(r.meterReading)} ${unit}` : "—"}</Td>
                      <Td className="text-slate-500">{r.issuedBy.name}</Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableScroll>
        </CardContent>
      </Card>

      {user?.role === "ADMIN" && (
        <AdminOnly role={user.role}>
          <CollapsibleCard title="Edit asset (admin)" defaultOpen={false}>
            <AssetEditForm asset={asset} />
          </CollapsibleCard>
        </AdminOnly>
      )}
    </div>
  );
}
