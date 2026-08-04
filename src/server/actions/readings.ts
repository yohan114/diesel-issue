"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { assertMeterForward } from "@/lib/fuel";
import type { MeterType } from "@/lib/enums";
import { toActionError } from "@/lib/errors";
import { type ActionState, str, optStr, zodFieldErrors } from "@/lib/forms";

const schema = z.object({
  assetId: z.string().min(1, "Select an asset"),
  value: z.number().nonnegative("Reading cannot be negative"),
  readingDate: z.date(),
});

export async function createReading(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await assertCan("create");
    const dateRaw = optStr(fd, "readingDate");
    const parsed = schema.safeParse({
      assetId: str(fd, "assetId"),
      value: Number(str(fd, "value")),
      readingDate: dateRaw ? new Date(dateRaw) : new Date(),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const data = parsed.data;

    const asset = await db.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) return { ok: false, error: "Asset not found." };
    const meterType = asset.meterType as MeterType;

    const reading = await db.$transaction(async (tx) => {
      await assertMeterForward(tx, asset.id, meterType, data.value);
      return tx.meterReading.create({
        data: {
          assetId: asset.id,
          value: data.value,
          readingType: meterType,
          readingDate: data.readingDate,
          source: "MANUAL",
          recordedById: user.id,
        },
      });
    });

    await writeAudit(user.id, "CREATE", "MeterReading", reading.id, `${asset.code} ${data.value} ${meterType === "KM" ? "km" : "hrs"}`);
    revalidatePath("/readings");
    revalidatePath(`/fleet/${asset.id}`);
    return { ok: true, message: `Reading saved for ${asset.code}.` };
  } catch (err) {
    return toActionError(err);
  }
}
