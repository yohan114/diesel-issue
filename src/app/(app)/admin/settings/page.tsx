import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/forms/settings-form";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rows = await db.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Scheduler and backup configuration." />

      <Card>
        <CardHeader><CardTitle>Automation</CardTitle></CardHeader>
        <CardContent>
          <SettingsForm
            scraperEnabled={map["scraper.enabled"] !== "false"}
            scraperCron={map["scraper.cron"] ?? "0 6 1 * *"}
            backupCron={map["backup.cron"] ?? "30 2 * * *"}
            retentionDays={Number(map["backup.retentionDays"]) || 7}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Last price refresh: <span className="font-medium text-slate-900">{map["price.lastRefreshAt"] ? formatDateTime(map["price.lastRefreshAt"]) : "never"}</span></p>
          <p>Last backup: <span className="font-medium text-slate-900">{map["backup.lastRunAt"] ? formatDateTime(map["backup.lastRunAt"]) : "never"}</span></p>
          <p className="text-xs text-slate-400">
            The in-process scheduler runs when the server is started with <code>ENABLE_SCHEDULER=true</code>. Schedule
            changes take effect on the next server restart.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
