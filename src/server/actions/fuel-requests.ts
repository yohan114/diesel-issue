"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { recordFuelIssue } from "@/lib/fuel";
import { fuelKindSchema, type MeterType } from "@/lib/enums";
import { toActionError, AppError } from "@/lib/errors";
import { type ActionState, str, optStr, zodFieldErrors } from "@/lib/forms";

const createSchema = z.object({
  assetId: z.string().min(1, "Select an asset"),
  fuelKind: fuelKindSchema,
  requestedLitres: z.number().positive("Enter litres greater than 0"),
  meterReading: z.number().nonnegative().optional(),
  reason: z.string().max(300).optional(),
});

// USER (and admin) can submit a fuel request.
export async function createRequest(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await assertCan("create");
    const meterRaw = optStr(fd, "meterReading");
    const parsed = createSchema.safeParse({
      assetId: str(fd, "assetId"),
      fuelKind: str(fd, "fuelKind"),
      requestedLitres: Number(str(fd, "requestedLitres")),
      meterReading: meterRaw !== undefined ? Number(meterRaw) : undefined,
      reason: optStr(fd, "reason"),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const data = parsed.data;

    const asset = await db.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) return { ok: false, error: "Asset not found." };

    const req = await db.fuelRequest.create({
      data: {
        assetId: asset.id,
        fuelKind: data.fuelKind,
        requestedLitres: data.requestedLitres,
        meterReading: data.meterReading ?? null,
        readingType: data.meterReading != null ? (asset.meterType as MeterType) : null,
        reason: data.reason ?? null,
        status: "PENDING",
        requestedById: user.id,
      },
    });
    await writeAudit(user.id, "CREATE", "FuelRequest", req.id, `Requested ${data.requestedLitres}L for ${asset.code}`);
    revalidatePath("/fuel/requests");
    revalidatePath("/dashboard");
    return { ok: true, message: `Fuel request for ${asset.code} submitted for approval.` };
  } catch (err) {
    return toActionError(err);
  }
}

const approveSchema = z.object({
  requestId: z.string().min(1),
  litres: z.number().positive("Enter the litres to issue"),
  source: z.string().max(120).optional(),
  issueDate: z.date(),
});

// ADMIN-only: approve a request, which creates the linked fuel issue + reading.
export async function approveRequest(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await assertCan("approve");
    const dateRaw = optStr(fd, "issueDate");
    const parsed = approveSchema.safeParse({
      requestId: str(fd, "requestId"),
      litres: Number(str(fd, "litres")),
      source: optStr(fd, "source"),
      issueDate: dateRaw ? new Date(dateRaw) : new Date(),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const { requestId, litres, source, issueDate } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const req = await tx.fuelRequest.findUnique({ where: { id: requestId }, include: { asset: true } });
      if (!req) throw new AppError("NOT_FOUND", 404, "Request not found.");
      if (req.status !== "PENDING") throw new AppError("ALREADY_REVIEWED", 400, "This request has already been reviewed.");

      const issue = await recordFuelIssue(tx, {
        assetId: req.assetId,
        meterType: req.asset.meterType as MeterType,
        fuelKind: req.fuelKind as z.infer<typeof fuelKindSchema>,
        litres,
        meterReading: req.meterReading,
        issueDate,
        source: source ?? null,
        issuedById: admin.id,
        linkedRequestId: req.id,
      });
      await tx.fuelRequest.update({
        where: { id: req.id },
        data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
      });
      return { issue, code: req.asset.code, assetId: req.assetId };
    });

    await writeAudit(admin.id, "APPROVE", "FuelRequest", requestId, `Approved & issued ${litres}L to ${result.code}`);
    revalidatePath("/fuel/requests");
    revalidatePath("/fuel/issues");
    revalidatePath("/dashboard");
    revalidatePath(`/fleet/${result.assetId}`);
    return { ok: true, message: `Approved — ${litres} L issued to ${result.code}.` };
  } catch (err) {
    return toActionError(err);
  }
}

// ADMIN-only: reject a request.
export async function rejectRequest(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await assertCan("approve");
    const requestId = str(fd, "requestId");
    const note = optStr(fd, "reviewNote");
    if (!requestId) return { ok: false, error: "Missing request." };

    const req = await db.fuelRequest.findUnique({ where: { id: requestId } });
    if (!req) return { ok: false, error: "Request not found." };
    if (req.status !== "PENDING") return { ok: false, error: "This request has already been reviewed." };

    await db.fuelRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date(), reviewNote: note ?? null },
    });
    await writeAudit(admin.id, "REJECT", "FuelRequest", requestId, note ?? "Rejected");
    revalidatePath("/fuel/requests");
    revalidatePath("/dashboard");
    return { ok: true, message: "Request rejected." };
  } catch (err) {
    return toActionError(err);
  }
}
