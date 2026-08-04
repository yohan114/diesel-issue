import { db } from "../db";
import { writeAudit } from "../audit";
import { FUEL_KINDS, type FuelKind } from "../enums";

const CEYPETCO_URL = "https://ceypetco.gov.lk/historical-prices/";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Look for a fuel label in the page text and grab the nearest plausible price.
function extractPrice(text: string, labels: string[]): number | undefined {
  const lower = text.toLowerCase();
  for (const label of labels) {
    const idx = lower.indexOf(label.toLowerCase());
    if (idx === -1) continue;
    const window = text.slice(idx, idx + 140);
    const m = window.match(/(\d{2,4}(?:[.,]\d{1,2})?)/);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ""));
      if (num > 50 && num < 5000) return Math.round(num * 100); // -> LKR cents
    }
  }
  return undefined;
}

export type FetchedPrices = Partial<Record<FuelKind, number>>;

// Best-effort fetch of Ceypetco prices. The government site frequently blocks
// bots (HTTP 403); on any failure we return null so the caller falls back to
// manual entry rather than writing garbage.
export async function fetchCeypetcoPrices(): Promise<FetchedPrices | null> {
  try {
    const res = await fetch(CEYPETCO_URL, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://ceypetco.gov.lk/",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const auto = extractPrice(text, ["Lanka Auto Diesel", "Auto Diesel"]);
    const sup = extractPrice(text, ["Lanka Super Diesel", "Super Diesel"]);
    if (auto == null && sup == null) return null;
    return { AUTO_DIESEL: auto, SUPER_DIESEL: sup };
  } catch {
    return null;
  }
}

export type RefreshResult = { updated: FuelKind[]; source: string; error?: string };

// Fetch + persist (only-if-changed). Idempotent thanks to the unique
// [fuelKind, effectiveFrom]. Always records the outcome in settings + audit.
export async function runPriceRefresh(): Promise<RefreshResult> {
  const fetched = await fetchCeypetcoPrices();
  const now = new Date();

  if (!fetched) {
    await db.setting.upsert({
      where: { key: "price.lastRefreshError" },
      update: { value: `Ceypetco unreachable/blocked at ${now.toISOString()}` },
      create: { key: "price.lastRefreshError", value: `Ceypetco unreachable/blocked at ${now.toISOString()}` },
    });
    await writeAudit(null, "PRICE_REFRESH", "FuelPrice", null, "Automatic fetch failed — manual entry required");
    return { updated: [], source: "NONE", error: "Could not fetch Ceypetco (site blocks bots). Enter the price manually." };
  }

  const effectiveFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const updated: FuelKind[] = [];
  for (const kind of FUEL_KINDS) {
    const cents = fetched[kind];
    if (cents == null) continue;
    const latest = await db.fuelPrice.findFirst({ where: { fuelKind: kind }, orderBy: { effectiveFrom: "desc" } });
    if (latest && latest.pricePerLitre === cents) continue; // unchanged
    try {
      await db.fuelPrice.create({ data: { fuelKind: kind, pricePerLitre: cents, effectiveFrom, source: "CEYPETCO" } });
      updated.push(kind);
    } catch {
      // unique [fuelKind, effectiveFrom] — already recorded today
    }
  }

  await db.setting.upsert({
    where: { key: "price.lastRefreshAt" },
    update: { value: now.toISOString() },
    create: { key: "price.lastRefreshAt", value: now.toISOString() },
  });
  await writeAudit(null, "PRICE_REFRESH", "FuelPrice", null, updated.length ? `Updated ${updated.join(", ")}` : "No change");
  return { updated, source: "CEYPETCO" };
}
