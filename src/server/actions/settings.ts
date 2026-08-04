"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { toActionError } from "@/lib/errors";
import { type ActionState, str } from "@/lib/forms";

const KEYS = ["scraper.enabled", "scraper.cron", "backup.cron", "backup.retentionDays"] as const;

// ADMIN-only: persist scheduler / backup settings.
export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await assertCan("manage");
    const values: Record<string, string> = {
      "scraper.enabled": fd.get("scraperEnabled") ? "true" : "false",
      "scraper.cron": str(fd, "scraperCron") || "0 6 1 * *",
      "backup.cron": str(fd, "backupCron") || "30 2 * * *",
      "backup.retentionDays": String(Math.max(1, Number(str(fd, "retentionDays")) || 7)),
    };
    for (const key of KEYS) {
      await db.setting.upsert({ where: { key }, update: { value: values[key] }, create: { key, value: values[key] } });
    }
    await writeAudit(admin.id, "UPDATE", "Setting", null, "Updated scheduler/backup settings");
    revalidatePath("/admin/settings");
    return { ok: true, message: "Settings saved. Restart the server for scheduler changes to take effect." };
  } catch (err) {
    return toActionError(err);
  }
}
