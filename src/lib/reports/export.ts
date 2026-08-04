import * as XLSX from "xlsx";
import type { monthlyReport } from "./aggregate";
import { centsToRupees } from "@/lib/money";
import { monthLabel } from "@/lib/utils";
import { FUEL_LABELS, METER_UNIT, type FuelKind, type MeterType } from "@/lib/enums";

type Report = Awaited<ReturnType<typeof monthlyReport>>;

function summaryRows(r: Report): (string | number)[][] {
  const rows: (string | number)[][] = [
    ["Fleet Fuel — Monthly Report"],
    ["Period", monthLabel(r.year, r.month)],
    [],
    ["Totals"],
    ["Total litres", Math.round(r.totals.litres)],
    ["Total cost (LKR)", centsToRupees(r.totals.cost)],
    ["Number of issues", r.totals.count],
    [],
    ["By fuel type", "Litres", "Cost (LKR)", "Issues"],
  ];
  for (const f of r.fuel) {
    rows.push([FUEL_LABELS[f.fuelKind as FuelKind], Math.round(f.litres), centsToRupees(f.cost), f.count]);
  }
  return rows;
}

function assetRows(r: Report): (string | number)[][] {
  const head = ["Code", "Category", "Meter", "Litres", "Cost (LKR)", "Running", "Unit", "Efficiency"];
  const body = r.assets.map((a) => [
    a.code,
    a.category,
    a.meterType,
    Math.round(a.litres),
    centsToRupees(a.cost),
    a.running ?? "",
    METER_UNIT[a.meterType as MeterType],
    a.efficiency != null ? Number(a.efficiency.toFixed(2)) : "",
  ]);
  return [head, ...body];
}

function categoryRows(r: Report): (string | number)[][] {
  const head = ["Category", "Assets fuelled", "Litres", "Cost (LKR)"];
  const body = r.categories.map((c) => [c.category, c.assets, Math.round(c.litres), centsToRupees(c.cost)]);
  return [head, ...body];
}

export function buildWorkbook(r: Report): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows(r)), "Summary");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(assetRows(r)), "By Asset");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(categoryRows(r)), "By Category");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function buildCsv(r: Report): string {
  return XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(assetRows(r)));
}
