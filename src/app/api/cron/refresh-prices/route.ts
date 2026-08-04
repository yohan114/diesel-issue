import { type NextRequest, NextResponse } from "next/server";
import { runPriceRefresh } from "@/lib/jobs/refresh-prices";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-cron-secret");
  return !!secret && secret === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const result = await runPriceRefresh();
  return NextResponse.json({ ok: true, result });
}
