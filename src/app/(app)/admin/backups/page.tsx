import { DatabaseBackup } from "lucide-react";
import { db } from "@/lib/db";
import { listBackups } from "@/lib/jobs/backup";
import { backupNow } from "@/server/actions/backups";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, THead, Th, Tr, Td, TableScroll, EmptyRow } from "@/components/ui/table";
import { ActionButton } from "@/components/forms/action-button";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
}

export default async function BackupsPage() {
  const [backups, retention, lastRun] = await Promise.all([
    listBackups(),
    db.setting.findUnique({ where: { key: "backup.retentionDays" } }),
    db.setting.findUnique({ where: { key: "backup.lastRunAt" } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Backups" subtitle="Daily SQLite snapshots with rotation.">
        <ActionButton action={backupNow} pendingText="Backing up…">
          <DatabaseBackup className="h-4 w-4" /> Back up now
        </ActionButton>
      </PageHeader>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div><p className="text-slate-500">Snapshots</p><p className="text-lg font-semibold text-slate-900">{backups.length}</p></div>
          <div><p className="text-slate-500">Retention</p><p className="text-lg font-semibold text-slate-900">{Number(retention?.value) || 7} days</p></div>
          <div><p className="text-slate-500">Last backup</p><p className="text-lg font-semibold text-slate-900">{lastRun ? formatDateTime(lastRun.value) : "never"}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Snapshots</CardTitle></CardHeader>
        <CardContent className="p-0">
          <TableScroll>
            <Table className="min-w-[440px]">
              <THead>
                <tr><Th>File</Th><Th className="text-right">Size</Th><Th>Created</Th></tr>
              </THead>
              <tbody>
                {backups.length === 0 ? (
                  <EmptyRow colSpan={3}>No backups yet. Click “Back up now”.</EmptyRow>
                ) : (
                  backups.map((b) => (
                    <Tr key={b.name}>
                      <Td className="font-mono text-xs text-slate-700">{b.name}</Td>
                      <Td className="text-right text-slate-500">{formatBytes(b.bytes)}</Td>
                      <Td className="text-slate-500">{formatDateTime(b.createdAt)}</Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableScroll>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400">
        Snapshots are stored in the server’s <code>/backups</code> folder (gitignored). For disaster recovery, copy them
        off-box (e.g. rsync or cloud storage) on a schedule.
      </p>
    </div>
  );
}
