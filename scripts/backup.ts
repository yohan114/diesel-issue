// Standalone daily backup (for system cron): `tsx scripts/backup.ts`
import { runBackup } from "../src/lib/jobs/backup";

(async () => {
  try {
    const r = await runBackup(Number(process.env.BACKUP_RETENTION_DAYS) || 7);
    console.log(`Backup OK: ${r.name} (${r.bytes} bytes); rotated ${r.removed} old snapshot(s).`);
    process.exit(0);
  } catch (e) {
    console.error("Backup failed:", e);
    process.exit(1);
  }
})();
