// One-off: parse prisma/fleet.xlsx into prisma/fleet-seed.json (committed seed source).
// After re-uploading the MACHINE_LIST workbook to prisma/fleet.xlsx, run:
//   npx tsx scripts/gen-fleet-json.ts && npm run seed
import * as XLSX from "xlsx";
import * as path from "path";
import { promises as fs } from "fs";

function s(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}
function toInt(v: unknown): number | null {
  const t = s(v);
  if (!t) return null;
  const n = parseInt(t.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 1900 && n < 2100 ? n : null;
}

type Imp = {
  code: string; brand: string | null; typeLabel: string | null; model: string | null;
  regNo: string | null; capacity: string | null; yom: number | null;
  serialNo: string | null; chassisNo: string | null; engineNo: string | null; site: string | null;
};

async function main() {
  const wb = XLSX.readFile(path.join(process.cwd(), "prisma", "fleet.xlsx"));
  const imports: Imp[] = [];

  const plant = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["Plant list"], { header: 1, blankrows: false, defval: null });
  for (let i = 3; i < plant.length; i++) {
    const r = plant[i] as unknown[];
    const code = s(r[1]);
    if (!code || !s(r[0]) || !/^\d+$/.test(String(r[0]).trim())) continue;
    imports.push({
      code, brand: s(r[2]), typeLabel: s(r[3]), model: s(r[4]), regNo: s(r[5]),
      capacity: s(r[6]), yom: toInt(r[7]), serialNo: s(r[8]), chassisNo: s(r[9]), engineNo: s(r[10]), site: null,
    });
  }

  const bike = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["Bike"], { header: 1, blankrows: false, defval: null });
  for (let i = 2; i < bike.length; i++) {
    const r = bike[i] as unknown[];
    const reg = s(r[5]);
    const code = s(r[1]) ?? (reg ? `MB-${reg}` : null);
    if (!code || !s(r[0]) || !/^\d+$/.test(String(r[0]).trim())) continue;
    imports.push({
      code, brand: s(r[2]), typeLabel: s(r[3]) ?? "Motor Bicycle", model: s(r[4]), regNo: reg,
      capacity: s(r[6]), yom: null, serialNo: s(r[7]), chassisNo: null, engineNo: null, site: s(r[8]),
    });
  }

  const byCode = new Map<string, Imp>();
  for (const a of imports) byCode.set(a.code, a);
  const out = [...byCode.values()];

  await fs.writeFile(path.join(process.cwd(), "prisma", "fleet-seed.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote prisma/fleet-seed.json with ${out.length} assets.`);
}

main();
