// Functional check of the fuel + metering math. Self-cleaning. Run: tsx scripts/test-flow.ts
import { db } from "../src/lib/db";
import { recordFuelIssue } from "../src/lib/fuel";
import { getRunning, getFuelTotals, efficiency } from "../src/lib/metering";
import { monthBounds, currentYearMonth } from "../src/lib/utils";
import type { MeterType } from "../src/lib/enums";

async function main() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  const asset = await db.asset.findFirst({ where: { meterType: "HOURS" } });
  if (!admin || !asset) throw new Error("need an admin + an HOURS asset (run the seed first)");

  const { year, month } = currentYearMonth();
  const { from, to } = monthBounds(year, month);
  const day = (d: number) => new Date(year, month - 1, d, 9, 0, 0);

  const baseline = await db.meterReading.create({
    data: { assetId: asset.id, value: 1000, readingType: "HOURS", readingDate: day(1), source: "MANUAL", recordedById: admin.id },
  });
  const issue = await db.$transaction((tx) =>
    recordFuelIssue(tx, {
      assetId: asset.id,
      meterType: asset.meterType as MeterType,
      fuelKind: "AUTO_DIESEL",
      litres: 50,
      meterReading: 1080,
      issueDate: day(15),
      issuedById: admin.id,
    }),
  );

  const running = await getRunning(asset.id, "HOURS", from, to);
  const totals = await getFuelTotals(asset.id, from, to);
  const eff = efficiency("HOURS", running, totals.litres);

  let failed = 0;
  const check = (label: string, got: unknown, want: unknown) => {
    const ok = got === want;
    if (!ok) failed++;
    console.log(`${ok ? "✓" : "✗"} ${label}: ${got} (want ${want})`);
  };

  console.log(`Asset ${asset.code} (HOURS)`);
  check("price snapshot (cents)", issue.pricePerLitre, 40700);
  check("total cost (cents) = 50 * 40700", issue.totalCost, 50 * 40700);
  check("running this month (hrs)", running, 80);
  check("litres this month", totals.litres, 50);
  check("efficiency L/hr = 50/80", eff != null ? Number(eff.toFixed(4)) : null, 0.625);

  await db.meterReading.deleteMany({ where: { sourceIssueId: issue.id } });
  await db.fuelIssue.delete({ where: { id: issue.id } });
  await db.meterReading.delete({ where: { id: baseline.id } });
  console.log("(cleaned up test rows)");

  await db.$disconnect();
  if (failed) process.exit(1);
  console.log("\nFunctional flow OK.");
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
