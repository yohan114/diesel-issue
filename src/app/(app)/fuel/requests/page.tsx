import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { getAssetOptions } from "@/lib/assets";
import { PageHeader } from "@/components/layout/page-header";
import { CollapsibleCard } from "@/components/layout/collapsible-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { FuelRequestForm } from "@/components/forms/fuel-request-form";
import { RequestReview } from "@/components/forms/request-review";
import { formatDate, formatNumber } from "@/lib/utils";
import { FUEL_SHORT, type FuelKind, type MeterType } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function FuelRequestsPage() {
  const user = await getSessionUser();
  const isAdmin = user?.role === "ADMIN";

  const [assets, requests] = await Promise.all([
    getAssetOptions(),
    db.fuelRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        asset: { select: { code: true } },
        requestedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } },
      },
    }),
  ]);

  const pending = requests.filter((r) => r.status === "PENDING");
  const reviewed = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fuel Requests"
        subtitle={isAdmin ? "Review and approve operator fuel requests." : "Submit a fuel request for approval."}
      />

      <CollapsibleCard title="New fuel request">
        <FuelRequestForm assets={assets} />
      </CollapsibleCard>

      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
          <Badge tone="amber">{pending.length}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No pending requests.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.map((r) => (
                <li key={r.id} className="space-y-2 px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{r.asset.code}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(r.createdAt)} · {r.requestedBy.name} · {FUEL_SHORT[r.fuelKind as FuelKind]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatNumber(r.requestedLitres, 1)} L</p>
                      {r.meterReading != null && (
                        <p className="text-xs text-slate-500">
                          {formatNumber(r.meterReading)} {(r.readingType as MeterType) === "KM" ? "km" : "hrs"}
                        </p>
                      )}
                    </div>
                  </div>
                  {r.reason && <p className="text-sm text-slate-600">“{r.reason}”</p>}
                  {isAdmin ? (
                    <RequestReview requestId={r.id} requestedLitres={r.requestedLitres} />
                  ) : (
                    <Badge tone="amber">Awaiting approval</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reviewed</CardTitle>
          <span className="text-xs text-slate-500">{reviewed.length} shown</span>
        </CardHeader>
        <CardContent className="p-0">
          {reviewed.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Nothing reviewed yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {reviewed.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                  <div>
                    <p className="font-medium text-slate-900">{r.asset.code}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(r.createdAt)} · {r.requestedBy.name} · {FUEL_SHORT[r.fuelKind as FuelKind]} · {formatNumber(r.requestedLitres, 1)} L
                    </p>
                    {r.reviewNote && <p className="text-xs text-slate-500">Note: {r.reviewNote}</p>}
                  </div>
                  <div className="text-right">
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    {r.reviewedBy && <p className="mt-1 text-xs text-slate-400">by {r.reviewedBy.name}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
