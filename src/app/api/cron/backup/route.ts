import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runBackup } from "@/lib/jobs/backup";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-cron-secret");
  return !!secret && secret === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const setting = await db.setting.findUnique({ where: { key: "backup.retentionDays" } });
  const result = await runBackup(Number(setting?.value) || 7);
  return NextResponse.json({ ok: true, result });
}
