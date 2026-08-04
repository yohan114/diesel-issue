// In-process scheduler: monthly Ceypetco price refresh + daily SQLite backup.
// Runs only in the Node.js server runtime when ENABLE_SCHEDULER !== "false".
// For multi-instance / serverless deployments use external cron hitting the
// /api/cron/* routes instead (this file is a single-VPS convenience).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.ENABLE_SCHEDULER === "false") return;

  const g = globalThis as unknown as { __schedulerStarted?: boolean };
  if (g.__schedulerStarted) return;
  g.__schedulerStarted = true;

  const cron = (await import("node-cron")).default;
  const priceCron = process.env.PRICE_REFRESH_CRON || "0 6 1 * *"; // 1st @ 06:00
  const backupCron = process.env.BACKUP_CRON || "30 2 * * *"; // daily @ 02:30

  if (cron.validate(priceCron)) {
    cron.schedule(priceCron, async () => {
      try {
        const { runPriceRefresh } = await import("@/lib/jobs/refresh-prices");
        await runPriceRefresh();
      } catch (e) {
        console.error("[scheduler] price refresh failed", e);
      }
    });
  }

  if (cron.validate(backupCron)) {
    cron.schedule(backupCron, async () => {
      try {
        const { db } = await import("@/lib/db");
        const { runBackup } = await import("@/lib/jobs/backup");
        const s = await db.setting.findUnique({ where: { key: "backup.retentionDays" } });
        await runBackup(Number(s?.value) || 7);
      } catch (e) {
        console.error("[scheduler] backup failed", e);
      }
    });
  }

  console.log(`[scheduler] registered — prices "${priceCron}", backup "${backupCron}"`);
}
