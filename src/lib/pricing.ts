import { db } from "./db";
import { AppError } from "./errors";
import { FUEL_KINDS, type FuelKind } from "./enums";
import type { FuelPrice } from "@prisma/client";

// The price governing a fueling = latest FuelPrice for that kind whose
// effectiveFrom <= the issue date.
export async function priceFor(fuelKind: FuelKind, date: Date): Promise<FuelPrice> {
  const price = await db.fuelPrice.findFirst({
    where: { fuelKind, effectiveFrom: { lte: date } },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!price) {
    throw new AppError(
      "NO_PRICE",
      400,
      `No ${fuelKind} price is configured on or before ${date.toLocaleDateString()}. An administrator must add a price first.`,
    );
  }
  return price;
}

// Current effective price per fuel kind (for dashboards / forms).
export async function latestPrices(asOf: Date = new Date()): Promise<Record<FuelKind, FuelPrice | null>> {
  const out = {} as Record<FuelKind, FuelPrice | null>;
  for (const kind of FUEL_KINDS) {
    out[kind] = await db.fuelPrice.findFirst({
      where: { fuelKind: kind, effectiveFrom: { lte: asOf } },
      orderBy: { effectiveFrom: "desc" },
    });
  }
  return out;
}
