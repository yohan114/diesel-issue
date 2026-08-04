"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { runPriceRefresh } from "@/lib/jobs/refresh-prices";
import { fuelKindSchema, FUEL_LABELS, type FuelKind } from "@/lib/enums";
import { rupeesToCents } from "@/lib/money";
import { toActionError } from "@/lib/errors";
import { type ActionState, str, optStr, zodFieldErrors } from "@/lib/forms";

const schema = z.object({
  fuelKind: fuelKindSchema,
  price: z.number().positive("Enter a price greater than 0"),
  effectiveFrom: z.date(),
  note: z.string().max(200).optional(),
});

// ADMIN-only manual price entry / override (the reliable source of truth).
export async function addPrice(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await assertCan("manage");
    const dateRaw = optStr(fd, "effectiveFrom");
    const parsed = schema.safeParse({
      fuelKind: str(fd, "fuelKind"),
      price: Number(str(fd, "price")),
      effectiveFrom: dateRaw ? new Date(dateRaw) : new Date(),
      note: optStr(fd, "note"),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodFieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const { fuelKind, price, effectiveFrom, note } = parsed.data;
    const cents = rupeesToCents(price);

    await db.fuelPrice.upsert({
      where: { fuelKind_effectiveFrom: { fuelKind, effectiveFrom } },
      update: { pricePerLitre: cents, source: "MANUAL", enteredById: admin.id, note: note ?? null },
      create: { fuelKind, pricePerLitre: cents, effectiveFrom, source: "MANUAL", enteredById: admin.id, note: note ?? null },
    });
    await writeAudit(admin.id, "CREATE", "FuelPrice", null, `${FUEL_LABELS[fuelKind as FuelKind]} = Rs.${price}/L from ${effectiveFrom.toLocaleDateString()}`);
    revalidatePath("/admin/prices");
    revalidatePath("/dashboard");
    return { ok: true, message: `Price saved: ${FUEL_LABELS[fuelKind as FuelKind]} Rs.${price.toFixed(2)}/L.` };
  } catch (err) {
    return toActionError(err);
  }
}

// ADMIN-only: trigger the best-effort Ceypetco scrape now.
export async function refreshPricesNow(): Promise<ActionState> {
  try {
    await assertCan("manage");
    const result = await runPriceRefresh();
    revalidatePath("/admin/prices");
    revalidatePath("/dashboard");
    if (result.error) return { ok: false, error: result.error };
    return {
      ok: true,
      message: result.updated.length ? `Updated: ${result.updated.join(", ")}.` : "Checked Ceypetco — prices already up to date.",
    };
  } catch (err) {
    return toActionError(err);
  }
}
