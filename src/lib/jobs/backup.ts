import { promises as fs } from "fs";
import * as path from "path";
import { db } from "../db";
import { writeAudit } from "../audit";

export type BackupResult = { file: string; name: string; bytes: number; removed: number };

// Consistent SQLite snapshot via VACUUM INTO (safe even while the DB is in use),
// plus rotation by retention days. Returns the new snapshot's path + size.
export async function runBackup(retentionDays = 7): Promise<BackupResult> {
  const dir = path.join(process.cwd(), "backups");
  await fs.mkdir(dir, { recursive: true });

  const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14); // YYYYMMDDHHMMSS
  const name = `app-${ts}.db`;
  const file = path.join(dir, name);

  await db.$executeRawUnsafe(`VACUUM INTO '${file.replace(/'/g, "''")}'`);

  // Rotation
  const cutoff = Date.now() - retentionDays * 86_400_000;
  let removed = 0;
  for (const entry of await fs.readdir(dir)) {
    if (!entry.startsWith("app-") || !entry.endsWith(".db") || entry === name) continue;
    const full = path.join(dir, entry);
    const st = await fs.stat(full);
    if (st.mtimeMs < cutoff) {
      await fs.unlink(full);
      removed++;
    }
  }

  const stat = await fs.stat(file);
  await db.setting.upsert({
    where: { key: "backup.lastRunAt" },
    update: { value: new Date().toISOString() },
    create: { key: "backup.lastRunAt", value: new Date().toISOString() },
  });
  await writeAudit(null, "BACKUP", "Database", null, `Snapshot ${name} (${stat.size} bytes), removed ${removed} old`);

  return { file, name, bytes: stat.size, removed };
}

export type BackupFile = { name: string; bytes: number; createdAt: Date };

export async function listBackups(): Promise<BackupFile[]> {
  const dir = path.join(process.cwd(), "backups");
  try {
    const entries = await fs.readdir(dir);
    const files: BackupFile[] = [];
    for (const e of entries) {
      if (!e.startsWith("app-") || !e.endsWith(".db")) continue;
      const st = await fs.stat(path.join(dir, e));
      files.push({ name: e, bytes: st.size, createdAt: st.mtime });
    }
    return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}
