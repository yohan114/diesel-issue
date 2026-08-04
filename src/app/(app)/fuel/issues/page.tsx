import { db } from "@/lib/db";
import { getAssetOptions } from "@/lib/assets";
import { PageHeader } from "@/components/layout/page-header";
import { CollapsibleCard } from "@/components/layout/collapsible-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, Th, Tr, Td, TableScroll, EmptyRow } from "@/components/ui/table";
import { FuelIssueForm } from "@/components/forms/fuel-issue-form";
import { formatLKR } from "@/lib/money";
import { formatDate, formatNumber } from "@/lib/utils";
import { FUEL_SHORT, type FuelKind, type MeterType } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function FuelIssuesPage() {
  const [assets, issues] = await Promise.all([
    getAssetOptions(),
    db.fuelIssue.findMany({
      orderBy: { issueDate: "desc" },
      take: 100,
      include: { asset: { select: { code: true } }, issuedBy: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Fuel Issues" subtitle="Record fuel dispensed directly to an asset." />

      <CollapsibleCard title="Record fuel issue">
        <FuelIssueForm assets={assets} />
      </CollapsibleCard>

      <Card>
        <CardHeader>
          <CardTitle>Recent issues</CardTitle>
          <span className="text-xs text-slate-500">{issues.length} shown</span>
        </CardHeader>
        <CardContent className="p-0">
          <TableScroll>
            <Table className="min-w-[760px]">
              <THead>
                <tr>
                  <Th>Date</Th>
                  <Th>Asset</Th>
                  <Th>Fuel</Th>
                  <Th className="text-right">Litres</Th>
                  <Th className="text-right">Rate</Th>
                  <Th className="text-right">Cost</Th>
                  <Th className="text-right">Reading</Th>
                  <Th>Source</Th>
                  <Th>By</Th>
                </tr>
              </THead>
              <tbody>
                {issues.length === 0 ? (
                  <EmptyRow colSpan={9}>No fuel issues recorded yet.</EmptyRow>
                ) : (
                  issues.map((r) => (
                    <Tr key={r.id}>
                      <Td>{formatDate(r.issueDate)}</Td>
                      <Td className="font-medium text-slate-900">{r.asset.code}</Td>
                      <Td><Badge tone={r.fuelKind === "SUPER_DIESEL" ? "violet" : "amber"}>{FUEL_SHORT[r.fuelKind as FuelKind]}</Badge></Td>
                      <Td className="text-right">{formatNumber(r.litres, 1)}</Td>
                      <Td className="text-right text-slate-500">{formatLKR(r.pricePerLitre)}</Td>
                      <Td className="text-right font-medium text-slate-900">{formatLKR(r.totalCost)}</Td>
                      <Td className="text-right text-slate-500">
                        {r.meterReading != null ? `${formatNumber(r.meterReading)} ${(r.readingType as MeterType) === "KM" ? "km" : "hrs"}` : "—"}
                      </Td>
                      <Td className="text-slate-500">{r.source ?? "—"}</Td>
                      <Td className="text-slate-500">{r.issuedBy.name}</Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableScroll>
        </CardContent>
      </Card>
    </div>
  );
}
