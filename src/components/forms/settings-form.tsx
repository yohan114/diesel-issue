"use client";

import { useActionState } from "react";
import { saveSettings } from "@/server/actions/settings";
import { Label, Input, FormError, FormSuccess } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleState } from "@/lib/forms";

type Props = {
  scraperEnabled: boolean;
  scraperCron: string;
  backupCron: string;
  retentionDays: number;
};

export function SettingsForm({ scraperEnabled, scraperCron, backupCron, retentionDays }: Props) {
  const [state, action] = useActionState(saveSettings, idleState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {state.ok && <div className="sm:col-span-2"><FormSuccess>{state.message}</FormSuccess></div>}
      {state.error && <div className="sm:col-span-2"><FormError>{state.error}</FormError></div>}

      <label className="flex items-center gap-3 sm:col-span-2">
        <input type="checkbox" name="scraperEnabled" defaultChecked={scraperEnabled} className="h-4 w-4 rounded border-slate-300 text-amber-500" />
        <span className="text-sm text-slate-700">Enable monthly automatic price refresh from Ceypetco</span>
      </label>

      <div>
        <Label>Price refresh schedule (cron)</Label>
        <Input name="scraperCron" defaultValue={scraperCron} placeholder="0 6 1 * *" />
        <p className="mt-1 text-xs text-slate-400">Default: 06:00 on the 1st of each month.</p>
      </div>
      <div>
        <Label>Daily backup schedule (cron)</Label>
        <Input name="backupCron" defaultValue={backupCron} placeholder="30 2 * * *" />
        <p className="mt-1 text-xs text-slate-400">Default: 02:30 every day.</p>
      </div>
      <div>
        <Label>Backup retention (days)</Label>
        <Input name="retentionDays" type="number" min="1" defaultValue={retentionDays} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
      </div>
    </form>
  );
}
