import { db } from "@/lib/db";
import { monthBounds, lastNMonths, MONTH_NAMES } from "@/lib/utils";
import { FUEL_KINDS, type FuelKind, type MeterType } from "@/lib/enums";
import { getRunning, efficiency } from "@/lib/metering";

export type RangeOpts = { fuelKind?: FuelKind; categoryId?: string };

function whereRange(from: Date, to: Date, opts: RangeOpts = {}) {
  return {
    issueDate: { gte: from, lt: to },
    ...(opts.fuelKind ? { fuelKind: opts.fuelKind } : {}),
    ...(opts.categoryId ? { asset: { categoryId: opts.categoryId } } : {}),
  };
}

export async function totalsInRange(from: Date, to: Date, opts: RangeOpts = {}) {
  const agg = await db.fuelIssue.aggregate({
    _sum: { litres: true, totalCost: true },
    _count: true,
    where: whereRange(from, to, opts),
  });
  return { litres: agg._sum.litres ?? 0, cost: agg._sum.totalCost ?? 0, count: agg._count };
}

export type FuelBreakdown = { fuelKind: FuelKind; litres: number; cost: number; count: number };

export async function byFuel(from: Date, to: Date, opts: RangeOpts = {}): Promise<FuelBreakdown[]> {
  const rows = await db.fuelIssue.groupBy({
    by: ["fuelKind"],
    _sum: { litres: true, totalCost: true },
    _count: true,
    where: whereRange(from, to, opts),
  });
  return FUEL_KINDS.map((k) => {
    const r = rows.find((x) => x.fuelKind === k);
    return { fuelKind: k, litres: r?._sum.litres ?? 0, cost: r?._sum.totalCost ?? 0, count: r?._count ?? 0 };
  });
}

export type AssetRow = {
  assetId: string;
  code: string;
  category: string;
  categoryId: string;
  meterType: MeterType;
  litres: number;
  cost: number;
  count: number;
  running: number | null;
  efficiency: number | null;
};

export async function perAsset(from: Date, to: Date, opts: RangeOpts = {}): Promise<AssetRow[]> {
  const grouped = await db.fuelIssue.groupBy({
    by: ["assetId"],
    _sum: { litres: true, totalCost: true },
    _count: true,
    where: whereRange(from, to, opts),
  });
  if (grouped.length === 0) return [];

  const assets = await db.asset.findMany({
    where: { id: { in: grouped.map((g) => g.assetId) } },
    include: { category: true },
  });
  const map = new Map(assets.map((a) => [a.id, a]));

  const rows: AssetRow[] = [];
  for (const g of grouped) {
    const a = map.get(g.assetId);
    if (!a) continue;
    const meterType = a.meterType as MeterType;
    const litres = g._sum.litres ?? 0;
    const running = await getRunning(a.id, meterType, from, to);
    rows.push({
      assetId: a.id,
      code: a.code,
      category: a.category.name,
      categoryId: a.categoryId,
      meterType,
      litres,
      cost: g._sum.totalCost ?? 0,
      count: g._count,
      running,
      efficiency: efficiency(meterType, running, litres),
    });
  }
  rows.sort((x, y) => y.litres - x.litres);
  return rows;
}

export type CategoryRow = {
  categoryId: string;
  category: string;
  litres: number;
  cost: number;
  assets: number;
};

export function rollUpByCategory(rows: AssetRow[]): CategoryRow[] {
  const m = new Map<string, CategoryRow>();
  for (const r of rows) {
    const cur = m.get(r.categoryId) ?? { categoryId: r.categoryId, category: r.category, litres: 0, cost: 0, assets: 0 };
    cur.litres += r.litres;
    cur.cost += r.cost;
    cur.assets += 1;
    m.set(r.categoryId, cur);
  }
  return [...m.values()].sort((a, b) => b.cost - a.cost);
}

export type TrendPoint = {
  label: string;
  year: number;
  month: number;
  litres: number;
  cost: number;
  autoDiesel: number;
  superDiesel: number;
};

export async function trend(nMonths: number): Promise<TrendPoint[]> {
  const out: TrendPoint[] = [];
  for (const m of lastNMonths(nMonths)) {
    const { from, to } = monthBounds(m.year, m.month);
    const t = await totalsInRange(from, to);
    const f = await byFuel(from, to);
    out.push({
      label: `${MONTH_NAMES[m.month - 1].slice(0, 3)} ${String(m.year).slice(2)}`,
      year: m.year,
      month: m.month,
      litres: Math.round(t.litres),
      cost: t.cost,
      autoDiesel: Math.round(f.find((x) => x.fuelKind === "AUTO_DIESEL")!.litres),
      superDiesel: Math.round(f.find((x) => x.fuelKind === "SUPER_DIESEL")!.litres),
    });
  }
  return out;
}

// Full monthly report bundle.
export async function monthlyReport(year: number, month: number, opts: RangeOpts = {}) {
  const { from, to } = monthBounds(year, month);
  const [totals, fuel, assets] = await Promise.all([
    totalsInRange(from, to, opts),
    byFuel(from, to, opts),
    perAsset(from, to, opts),
  ]);
  return {
    year,
    month,
    from,
    to,
    totals,
    fuel,
    assets,
    categories: rollUpByCategory(assets),
    topConsumers: assets.slice(0, 10),
  };
}
