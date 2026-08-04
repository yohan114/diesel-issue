import type { Prisma } from "@prisma/client";
import { AppError } from "./errors";
import { computeTotalCost } from "./money";
import type { FuelKind, MeterType } from "./enums";

type Tx = Prisma.TransactionClient;

// Odometers / hour-meters never go backwards. Reject a reading below the asset's
// latest same-type value (admins may pass allowBackward to override).
export async function assertMeterForward(
  tx: Tx,
  assetId: string,
  meterType: MeterType,
  value: number,
  allowBackward = false,
): Promise<void> {
  if (allowBackward) return;
  const last = await tx.meterReading.findFirst({
    where: { assetId, readingType: meterType },
    orderBy: { readingDate: "desc" },
  });
  if (last && value < last.value) {
    throw new AppError(
      "READING_BACKWARD",
      400,
      `Reading ${value} ${meterType === "KM" ? "km" : "hrs"} is below the last recorded value of ${last.value}. ` +
        `Enter a value greater than or equal to the previous reading.`,
    );
  }
}

// Create a fuel issue, snapshotting the price effective on its date, computing
// the cost, and (if a meter reading is supplied) writing the matching cumulative
// MeterReading row — all inside the caller's transaction.
export async function recordFuelIssue(
  tx: Tx,
  params: {
    assetId: string;
    meterType: MeterType;
    fuelKind: FuelKind;
    litres: number;
    meterReading?: number | null;
    issueDate: Date;
    source?: string | null;
    issuedById: string;
    linkedRequestId?: string | null;
  },
) {
  const price = await tx.fuelPrice.findFirst({
    where: { fuelKind: params.fuelKind, effectiveFrom: { lte: params.issueDate } },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!price) {
    throw new AppError(
      "NO_PRICE",
      400,
      `No ${params.fuelKind} price is configured on or before ${params.issueDate.toLocaleDateString()}. An administrator must add a price first.`,
    );
  }

  const hasReading = params.meterReading != null && Number.isFinite(params.meterReading);
  if (hasReading) {
    await assertMeterForward(tx, params.assetId, params.meterType, params.meterReading as number);
  }

  const totalCost = computeTotalCost(params.litres, price.pricePerLitre);
  const issue = await tx.fuelIssue.create({
    data: {
      assetId: params.assetId,
      fuelKind: params.fuelKind,
      litres: params.litres,
      meterReading: hasReading ? params.meterReading : null,
      readingType: hasReading ? params.meterType : null,
      pricePerLitre: price.pricePerLitre,
      totalCost,
      fuelPriceId: price.id,
      source: params.source ?? null,
      issueDate: params.issueDate,
      issuedById: params.issuedById,
      linkedRequestId: params.linkedRequestId ?? null,
    },
  });

  if (hasReading) {
    await tx.meterReading.create({
      data: {
        assetId: params.assetId,
        value: params.meterReading as number,
        readingType: params.meterType,
        readingDate: params.issueDate,
        source: "FUEL_ISSUE",
        sourceIssueId: issue.id,
        recordedById: params.issuedById,
      },
    });
  }

  return issue;
}
