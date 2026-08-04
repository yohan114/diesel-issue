"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { meterTypeSchema, assetStatusSchema } from "@/lib/enums";
import { toActionError } from "@/lib/errors";
import { type ActionState, str, optStr, zodFieldErrors } from "@/lib/forms";

const updateSchema = z.object({
  id: z.string().min(1),
  status: assetStatusSchema,
  meterType: meterTypeSchema,
  site: z.string().max(160).optional(),
  regNo: z.string().max(60).optional(),
  capacity: z.string().max(60).optional(),
  brand: z.string().max(80).optional(),
  model: z.string().max(80).optional(),
});

// ADMIN-only (update). A USER hits FORBIDDEN here — assets are management data.
export async function updateAsset(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await assertCan("update");
    const parsed = updateSchema.safeParse({
      id: str(fd, "id"),
      status: str(fd, "status"),
      meterType: str(fd, "meterType"),
      site: optStr(fd, "site"),
      regNo: optStr(fd, "regNo"),
      capacity: optStr(fd, "capacity"),
      brand: optStr(fd, "brand"),
      model: optStr(fd, "model"),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const { id, ...data } = parsed.data;

    const asset = await db.asset.update({
      where: { id },
      data: {
        status: data.status,
        meterType: data.meterType,
        site: data.site ?? null,
        regNo: data.regNo ?? null,
        capacity: data.capacity ?? null,
        brand: data.brand ?? null,
        model: data.model ?? null,
      },
    });
    await writeAudit(admin.id, "UPDATE", "Asset", id, `Updated ${asset.code}`);
    revalidatePath(`/fleet/${id}`);
    revalidatePath("/fleet");
    return { ok: true, message: "Asset updated." };
  } catch (err) {
    return toActionError(err);
  }
}

const createSchema = z.object({
  code: z.string().min(1, "Code is required"),
  categoryId: z.string().min(1, "Select a category"),
  meterType: meterTypeSchema,
  brand: z.string().max(80).optional(),
  typeLabel: z.string().max(120).optional(),
  regNo: z.string().max(60).optional(),
});

// ADMIN-only (manage).
export async function createAsset(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await assertCan("manage");
    const parsed = createSchema.safeParse({
      code: str(fd, "code").toUpperCase(),
      categoryId: str(fd, "categoryId"),
      meterType: str(fd, "meterType"),
      brand: optStr(fd, "brand"),
      typeLabel: optStr(fd, "typeLabel"),
      regNo: optStr(fd, "regNo"),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const data = parsed.data;

    const existing = await db.asset.findUnique({ where: { code: data.code } });
    if (existing) return { ok: false, error: `Asset code ${data.code} already exists.` };

    const asset = await db.asset.create({ data: { ...data, status: "ACTIVE" } });
    await writeAudit(admin.id, "CREATE", "Asset", asset.id, `Created ${asset.code}`);
    revalidatePath("/fleet");
    return { ok: true, message: `Asset ${asset.code} created.` };
  } catch (err) {
    return toActionError(err);
  }
}

// ADMIN-only (delete).
export async function deleteAsset(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await assertCan("delete");
    const id = str(fd, "id");
    const asset = await db.asset.findUnique({ where: { id }, include: { _count: { select: { fuelIssues: true, meterReadings: true } } } });
    if (!asset) return { ok: false, error: "Asset not found." };
    if (asset._count.fuelIssues > 0 || asset._count.meterReadings > 0) {
      return { ok: false, error: "Cannot delete an asset with fuel/reading history. Set it to Disposed instead." };
    }
    await db.asset.delete({ where: { id } });
    await writeAudit(admin.id, "DELETE", "Asset", id, `Deleted ${asset.code}`);
    revalidatePath("/fleet");
    return { ok: true, message: `Asset ${asset.code} deleted.` };
  } catch (err) {
    return toActionError(err);
  }
}
