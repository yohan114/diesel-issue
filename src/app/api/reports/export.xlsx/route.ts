import { type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/rbac";
import { monthlyReport } from "@/lib/reports/aggregate";
import { buildWorkbook } from "@/lib/reports/export";
import { currentYearMonth } from "@/lib/utils";
import type { FuelKind } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const cur = currentYearMonth();
  const year = Number(sp.get("year")) || cur.year;
  const month = Number(sp.get("month")) || cur.month;
  const fuel = (sp.get("fuel") as FuelKind | null) || undefined;
  const category = sp.get("category") || undefined;

  const report = await monthlyReport(year, month, { fuelKind: fuel, categoryId: category });
  const buf = buildWorkbook(report);

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="fuel-report-${year}-${String(month).padStart(2, "0")}.xlsx"`,
    },
  });
}
