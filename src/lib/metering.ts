import { db } from "./db";
import type { FuelKind, MeterType } from "./enums";
import { lastNMonths, monthBounds, MONTH_NAMES } from "./utils";

// Latest cumulative reading of a given type for an asset (for the backward-
// reading guard and asset detail headline).
export async function latestReading(assetId: string, readingType: MeterType) {
  return db.meterReading.findFirst({
    where: { assetId, readingType },
    orderBy: { readingDate: "desc" },
  });
}

// Running (distance km / hours) during [from, to). Anchored to the last reading
// strictly before the window when available, so sparse readings (e.g. one per
// fueling) still yield this period's usage; otherwise the within-window delta.
export async function getRunning(
  assetId: string,
  readingType: MeterType,
  from: Date,
  to: Date,
): Promise<number | null> {
  const inWindow = await db.meterReading.findMany({
    where: { assetId, readingType, readingDate: { gte: from, lt: to } },
    orderBy: { readingDate: "asc" },
    select: { value: true },
  });
  if (inWindow.length === 0) return null;

  const firstInWindow = inWindow[0].value;
  const lastInWindow = inWindow[inWindow.length - 1].value;

  const before = await db.meterReading.findFirst({
    where: { assetId, readingType, readingDate: { lt: from } },
    orderBy: { readingDate: "desc" },
    select: { value: true },
  });

  const baseline = before ? before.value : firstInWindow;
  const running = lastInWindow - baseline;
  return running >= 0 ? running : null;
}

// Sum of litres + cost (cents) of fuel issued to an asset in [from, to).
export async function getFuelTotals(
  assetId: string,
  from: Date,
  to: Date,
  fuelKind?: FuelKind,
): Promise<{ litres: number; cost: number }> {
  const agg = await db.fuelIssue.aggregate({
    _sum: { litres: true, totalCost: true },
    where: { assetId, issueDate: { gte: from, lt: to }, ...(fuelKind ? { fuelKind } : {}) },
  });
  return { litres: agg._sum.litres ?? 0, cost: agg._sum.totalCost ?? 0 };
}

// km/L for KM assets, litres/hour for HOURS assets. null when undefined.
export function efficiency(
  meterType: MeterType,
  running: number | null,
  litres: number,
): number | null {
  if (running == null || running <= 0 || litres <= 0) return null;
  return meterType === "KM" ? running / litres : litres / running;
}

export function efficiencyLabel(meterType: MeterType): string {
  return meterType === "KM" ? "km/L" : "L/hr";
}

// Per-month running + litres for an asset, for the asset-detail chart.
export async function assetMonthlyRunning(assetId: string, meterType: MeterType, nMonths: number) {
  const out: Array<{ label: string; running: number; litres: number; efficiency: number | null }> = [];
  for (const m of lastNMonths(nMonths)) {
    const { from, to } = monthBounds(m.year, m.month);
    const running = await getRunning(assetId, meterType, from, to);
    const { litres } = await getFuelTotals(assetId, from, to);
    out.push({
      label: `${MONTH_NAMES[m.month - 1].slice(0, 3)} ${String(m.year).slice(2)}`,
      running: running ?? 0,
      litres: Math.round(litres),
      efficiency: efficiency(meterType, running, litres),
    });
  }
  return out;
}
