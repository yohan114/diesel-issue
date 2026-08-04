import Link from "next/link";
import { Droplets, Wallet, ClipboardList, Truck, Fuel, TrendingUp, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { totalsInRange, byFuel, perAsset, trend } from "@/lib/reports/aggregate";
import { latestPrices } from "@/lib/pricing";
import { monthBounds, currentYearMonth, monthLabel, formatNumber, formatDate } from "@/lib/utils";
import { formatLKR } from "@/lib/money";
import { FUEL_LABELS, FUEL_SHORT, type FuelKind } from "@/lib/enums";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendChart } from "@/components/charts/trend-chart";
import { FuelSplitChart } from "@/components/charts/fuel-split-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const { year, month } = currentYearMonth();
  const { from, to } = monthBounds(year, month);

  const [totals, fuel, top, series, prices, pending, activeAssets, totalAssets, recent] = await Promise.all([
    totalsInRange(from, to),
    byFuel(from, to),
    perAsset(from, to),
    trend(6),
    latestPrices(),
    db.fuelRequest.count({ where: { status: "PENDING" } }),
    db.asset.count({ where: { status: "ACTIVE" } }),
    db.asset.count(),
    db.fuelIssue.findMany({ orderBy: { issueDate: "desc" }, take: 6, include: { asset: true } }),
  ]);

  const missingPrice = (Object.keys(prices) as FuelKind[]).filter((k) => !prices[k]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Welcome, {user?.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Fleet fuel overview · {monthLabel(year, month)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(prices) as FuelKind[]).map((k) => (
            <div key={k} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
              <span className="text-slate-500">{FUEL_SHORT[k]}: </span>
              <span className="font-semibold text-slate-900">
                {prices[k] ? formatLKR(prices[k]!.pricePerLitre) + "/L" : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {(missingPrice.length > 0 || pending > 0) && (
        <div className="space-y-2">
          {missingPrice.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              No price set for {missingPrice.map((k) => FUEL_LABELS[k]).join(", ")}. Fuel issues for it will be blocked.
              {user?.role === "ADMIN" && (
                <Link href="/admin/prices" className="ml-1 font-medium underline">Add price</Link>
              )}
            </div>
          )}
          {pending > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <ClipboardList className="h-4 w-4 shrink-0" />
              {pending} fuel request{pending > 1 ? "s" : ""} awaiting review.
              <Link href="/fuel/requests" className="ml-1 font-medium underline">Open requests</Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Fuel this month" value={`${formatNumber(Math.round(totals.litres))} L`} sub={`${totals.count} issues`} icon={Droplets} tone="amber" />
        <StatCard label="Spend this month" value={formatLKR(totals.cost)} sub={monthLabel(year, month)} icon={Wallet} tone="emerald" />
        <StatCard label="Pending requests" value={pending} sub="awaiting approval" icon={ClipboardList} tone="indigo" />
        <StatCard label="Active assets" value={activeAssets} sub={`of ${totalAssets} total`} icon={Truck} tone="slate" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-slate-400" /> Consumption & cost — last 6 months</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={series.map((s) => ({ label: s.label, litres: s.litres, cost: s.cost }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fuel split · {monthLabel(year, month)}</CardTitle>
          </CardHeader>
          <CardContent>
            <FuelSplitChart data={fuel} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top consumers · {monthLabel(year, month)}</CardTitle>
            <Link href="/reports" className="text-xs font-medium text-amber-600 hover:underline">View report</Link>
          </CardHeader>
          <CardContent className="p-0">
            {top.length === 0 ? (
              <Empty>No fuel issued yet this month.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {top.slice(0, 6).map((a, i) => (
                  <li key={a.assetId} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-5 text-sm font-medium text-slate-400">{i + 1}</span>
                      <div className="min-w-0">
                        <Link href={`/fleet/${a.assetId}`} className="block truncate font-medium text-slate-800 hover:text-amber-600">{a.code}</Link>
                        <span className="block truncate text-xs text-slate-500">{a.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatNumber(Math.round(a.litres))} L</p>
                      <p className="text-xs text-slate-500">
                        {a.efficiency != null ? `${formatNumber(a.efficiency, 1)} ${a.meterType === "KM" ? "km/L" : "L/hr"}` : "—"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent fuel issues</CardTitle>
            <Link href="/fuel/issues" className="text-xs font-medium text-amber-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <Empty>No fuel issues recorded yet.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Fuel className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{r.asset.code}</p>
                        <p className="truncate text-xs text-slate-500">{formatDate(r.issueDate)} · {FUEL_SHORT[r.fuelKind as FuelKind]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatNumber(r.litres, 1)} L</p>
                      <p className="text-xs text-slate-500">{formatLKR(r.totalCost)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-8 text-center text-sm text-slate-400">{children}</div>;
}
