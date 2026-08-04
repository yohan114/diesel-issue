"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { runBackup } from "@/lib/jobs/backup";
import { toActionError } from "@/lib/errors";
import type { ActionState } from "@/lib/forms";

// ADMIN-only: snapshot the database now.
export async function backupNow(): Promise<ActionState> {
  try {
    await assertCan("manage");
    const setting = await db.setting.findUnique({ where: { key: "backup.retentionDays" } });
    const retention = Number(setting?.value) || 7;
    const res = await runBackup(retention);
    revalidatePath("/admin/backups");
    return { ok: true, message: `Backup created: ${res.name} (${(res.bytes / 1024).toFixed(0)} KB).` };
  } catch (err) {
    return toActionError(err);
  }
}
