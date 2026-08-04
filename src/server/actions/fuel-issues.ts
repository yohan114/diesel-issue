"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { recordFuelIssue } from "@/lib/fuel";
import { fuelKindSchema, type MeterType } from "@/lib/enums";
import { toActionError } from "@/lib/errors";
import { type ActionState, str, optStr, zodFieldErrors } from "@/lib/forms";

const schema = z.object({
  assetId: z.string().min(1, "Select an asset"),
  fuelKind: fuelKindSchema,
  litres: z.number().positive("Enter litres greater than 0"),
  meterReading: z.number().nonnegative("Reading cannot be negative").optional(),
  issueDate: z.date(),
  source: z.string().max(120).optional(),
});

export async function createDirectIssue(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await assertCan("create");

    const meterRaw = optStr(fd, "meterReading");
    const dateRaw = optStr(fd, "issueDate");
    const parsed = schema.safeParse({
      assetId: str(fd, "assetId"),
      fuelKind: str(fd, "fuelKind"),
      litres: Number(str(fd, "litres")),
      meterReading: meterRaw !== undefined ? Number(meterRaw) : undefined,
      issueDate: dateRaw ? new Date(dateRaw) : new Date(),
      source: optStr(fd, "source"),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const data = parsed.data;

    const asset = await db.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) return { ok: false, error: "Asset not found." };

    const issue = await db.$transaction((tx) =>
      recordFuelIssue(tx, {
        assetId: asset.id,
        meterType: asset.meterType as MeterType,
        fuelKind: data.fuelKind,
        litres: data.litres,
        meterReading: data.meterReading ?? null,
        issueDate: data.issueDate,
        source: data.source ?? null,
        issuedById: user.id,
      }),
    );

    await writeAudit(user.id, "CREATE", "FuelIssue", issue.id, `Issued ${data.litres}L to ${asset.code}`);
    revalidatePath("/fuel/issues");
    revalidatePath("/dashboard");
    revalidatePath(`/fleet/${asset.id}`);
    return { ok: true, message: `Recorded ${data.litres} L issued to ${asset.code}.` };
  } catch (err) {
    return toActionError(err);
  }
}
