/**
 * Idempotent seed:
 *  1. Asset categories (E&C prefix -> name, default meter type, fleet group)
 *  2. Two fuel kinds' current prices (Lanka Auto Diesel / Super Diesel)
 *  3. Default admin (+ a demo operator) from env
 *  4. Fleet assets imported from prisma/fleet-seed.json (regenerate the full
 *     ~402-asset list from the MACHINE_LIST workbook via scripts/gen-fleet-json.ts)
 *  5. Default settings
 *
 * Re-runnable: everything upserts by a natural key.
 */
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Group = "ROAD_VEHICLE" | "MACHINERY_GENSET";
type Meter = "KM" | "HOURS";
type CatDef = { code: string; name: string; meterType: Meter; group: Group };

// E&C code prefix -> category. Road vehicles meter in KM, machinery/gensets in HOURS.
const CATEGORIES: CatDef[] = [
  // Road vehicles (odometer / km)
  { code: "DT", name: "Dump Truck", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "DC", name: "Double Cab", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "SC", name: "Single Cab", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "HCC", name: "Crew Cab", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "TM", name: "Truck Mixer", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "BD", name: "Low-bed / Bed", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "DB", name: "Diesel Bowser", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "WB", name: "Water Bowser", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "BS", name: "Bitumen Bowser", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "BM", name: "Boom Truck", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "PV", name: "Van", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "PM", name: "Prime Mover", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "LR", name: "Lorry", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "LT", name: "Lorry Trailer", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "SLM", name: "Self Loader Mixer", meterType: "KM", group: "ROAD_VEHICLE" },
  { code: "MB", name: "Motor Bike", meterType: "KM", group: "ROAD_VEHICLE" },
  // Machinery / gensets (hour meter)
  { code: "LB", name: "Backhoe Loader", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "LD", name: "Wheel Loader", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "SL", name: "Skid Steer Loader", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "MG", name: "Motor Grader", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "HEX", name: "Excavator", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "SR", name: "Static Roller", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "VR", name: "Vibrating Roller", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "PTR", name: "Pneumatic Roller", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "AP", name: "Asphalt Paver", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "CR", name: "Mobile Crane", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "PC", name: "Pump Truck", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "FL", name: "Fork Lift", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "FT", name: "Farm Tractor", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "PG", name: "Power Generator", meterType: "HOURS", group: "MACHINERY_GENSET" },
  { code: "AC", name: "Air Compressor", meterType: "HOURS", group: "MACHINERY_GENSET" },
  // Fallback bucket for any unrecognised code
  { code: "MISC", name: "Other / Unclassified", meterType: "KM", group: "ROAD_VEHICLE" },
];

// Fallback: match the free-text TYPE when a code prefix isn't recognised.
const TYPE_KEYWORDS: Array<[RegExp, string]> = [
  [/dump/i, "DT"], [/double\s*cab/i, "DC"], [/crew\s*cab/i, "HCC"], [/single\s*cab/i, "SC"],
  [/mixer/i, "TM"], [/back\s*hoe|backhoe/i, "LB"], [/wheel\s*loader/i, "LD"],
  [/skid/i, "SL"], [/grader/i, "MG"], [/excavat/i, "HEX"], [/vibrat/i, "VR"],
  [/static\s*roller/i, "SR"], [/pn(e)?umatic/i, "PTR"], [/paver/i, "AP"], [/crane/i, "CR"],
  [/pump/i, "PC"], [/fo(r)?k\s*lift|fock\s*lift/i, "FL"], [/tractor/i, "FT"],
  [/generator/i, "PG"], [/compressor/i, "AC"], [/diesel\s*bo(w|u)ser/i, "DB"],
  [/water\s*bo(w|u)ser/i, "WB"], [/bitumen/i, "BS"], [/boom/i, "BM"], [/prime\s*mover/i, "PM"],
  [/\bvan\b/i, "PV"], [/\bbed\b|low.?bed/i, "BD"], [/lorry/i, "LR"], [/motor\s*bic|motor\s*cycle|bike/i, "MB"],
];

function prefixOf(code: string): string {
  const m = String(code).trim().match(/^[A-Za-z]+/);
  return (m?.[0] ?? "").toUpperCase();
}

function resolveCategoryCode(code: string, typeText: string | null): { catCode: string; matched: boolean } {
  const pfx = prefixOf(code);
  if (CATEGORIES.some((c) => c.code === pfx)) return { catCode: pfx, matched: true };
  if (typeText) {
    for (const [re, cc] of TYPE_KEYWORDS) if (re.test(typeText)) return { catCode: cc, matched: true };
  }
  return { catCode: "MISC", matched: false };
}

type Imp = {
  code: string; brand: string | null; typeLabel: string | null; model: string | null;
  regNo: string | null; capacity: string | null; yom: number | null;
  serialNo: string | null; chassisNo: string | null; engineNo: string | null; site: string | null;
};

async function main() {
  console.log("→ Seeding categories…");
  const catId: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { code: c.code },
      update: { name: c.name, defaultMeterType: c.meterType, fleetGroup: c.group },
      create: { code: c.code, name: c.name, defaultMeterType: c.meterType, fleetGroup: c.group },
    });
    catId[c.code] = row.id;
  }
  console.log(`  ${CATEGORIES.length} categories ready.`);

  console.log("→ Seeding fuel prices (LKR cents)…");
  const effective = new Date(Date.UTC(2026, 4, 30)); // 2026-05-30
  for (const [fuelKind, price] of [["AUTO_DIESEL", 40700], ["SUPER_DIESEL", 47800]] as const) {
    await prisma.fuelPrice.upsert({
      where: { fuelKind_effectiveFrom: { fuelKind, effectiveFrom: effective } },
      update: { pricePerLitre: price, source: "MANUAL" },
      create: { fuelKind, pricePerLitre: price, effectiveFrom: effective, source: "MANUAL", note: "Ceypetco price effective 2026-05-30" },
    });
  }
  console.log("  Auto Diesel Rs.407.00 · Super Diesel Rs.478.00");

  console.log("→ Seeding users…");
  const adminUser = process.env.SEED_ADMIN_USERNAME || "admin";
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026";
  await prisma.user.upsert({
    where: { username: adminUser },
    update: {},
    create: {
      username: adminUser,
      name: process.env.SEED_ADMIN_NAME || "Administrator",
      passwordHash: await bcrypt.hash(adminPass, 11),
      role: "ADMIN",
    },
  });
  const opUser = process.env.SEED_USER_USERNAME || "operator";
  const opPass = process.env.SEED_USER_PASSWORD || "Operator!2026";
  await prisma.user.upsert({
    where: { username: opUser },
    update: {},
    create: {
      username: opUser,
      name: "Demo Operator",
      passwordHash: await bcrypt.hash(opPass, 11),
      role: "USER",
    },
  });
  console.log(`  admin='${adminUser}' (ADMIN), '${opUser}' (USER). Change passwords after first login!`);

  console.log("→ Importing fleet from prisma/fleet-seed.json…");
  const imports: Imp[] = JSON.parse(
    await fs.readFile(path.join(process.cwd(), "prisma", "fleet-seed.json"), "utf8"),
  );

  const counts: Record<string, number> = {};
  const unmatched: string[] = [];
  for (const a of imports) {
    const { catCode, matched } = resolveCategoryCode(a.code, a.typeLabel);
    if (!matched) unmatched.push(`${a.code} (${a.typeLabel ?? "?"})`);
    const cat = CATEGORIES.find((c) => c.code === catCode)!;
    counts[catCode] = (counts[catCode] ?? 0) + 1;
    await prisma.asset.upsert({
      where: { code: a.code },
      update: {
        brand: a.brand, typeLabel: a.typeLabel, model: a.model, regNo: a.regNo,
        capacity: a.capacity, yom: a.yom, serialNo: a.serialNo, chassisNo: a.chassisNo,
        engineNo: a.engineNo, site: a.site, categoryId: catId[catCode], meterType: cat.meterType,
      },
      create: {
        code: a.code, brand: a.brand, typeLabel: a.typeLabel, model: a.model, regNo: a.regNo,
        capacity: a.capacity, yom: a.yom, serialNo: a.serialNo, chassisNo: a.chassisNo,
        engineNo: a.engineNo, site: a.site, categoryId: catId[catCode], meterType: cat.meterType,
        status: "ACTIVE",
      },
    });
  }

  console.log(`  Imported ${imports.length} assets.`);
  const summary = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join("  ");
  console.log("  By category: " + summary);
  if (unmatched.length) console.warn(`  ⚠ ${unmatched.length} routed to MISC: ${unmatched.slice(0, 10).join(", ")}${unmatched.length > 10 ? "…" : ""}`);

  console.log("→ Seeding settings…");
  const settings: Record<string, string> = {
    "scraper.enabled": "true",
    "scraper.cron": process.env.PRICE_REFRESH_CRON || "0 6 1 * *",
    "backup.cron": process.env.BACKUP_CRON || "30 2 * * *",
    "backup.retentionDays": process.env.BACKUP_RETENTION_DAYS || "7",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log("✓ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
