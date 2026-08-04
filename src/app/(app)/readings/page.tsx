import { db } from "@/lib/db";
import { getAssetOptions } from "@/lib/assets";
import { PageHeader } from "@/components/layout/page-header";
import { CollapsibleCard } from "@/components/layout/collapsible-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, Th, Tr, Td, TableScroll, EmptyRow } from "@/components/ui/table";
import { ReadingForm } from "@/components/forms/reading-form";
import { formatDate, formatNumber } from "@/lib/utils";
import type { MeterType } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function ReadingsPage() {
  const [assets, readings] = await Promise.all([
    getAssetOptions(),
    db.meterReading.findMany({
      orderBy: { readingDate: "desc" },
      take: 100,
      include: { asset: { select: { code: true } }, recordedBy: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Running / Meter Readings" subtitle="Log odometer (km) or hour-meter (hrs) readings to track running." />

      <CollapsibleCard title="Add reading">
        <ReadingForm assets={assets} />
      </CollapsibleCard>

      <Card>
        <CardHeader>
          <CardTitle>Recent readings</CardTitle>
          <span className="text-xs text-slate-500">{readings.length} shown</span>
        </CardHeader>
        <CardContent className="p-0">
          <TableScroll>
            <Table className="min-w-[560px]">
              <THead>
                <tr>
                  <Th>Date</Th>
                  <Th>Asset</Th>
                  <Th className="text-right">Reading</Th>
                  <Th>Type</Th>
                  <Th>Source</Th>
                  <Th>By</Th>
                </tr>
              </THead>
              <tbody>
                {readings.length === 0 ? (
                  <EmptyRow colSpan={6}>No readings recorded yet.</EmptyRow>
                ) : (
                  readings.map((r) => (
                    <Tr key={r.id}>
                      <Td>{formatDate(r.readingDate)}</Td>
                      <Td className="font-medium text-slate-900">{r.asset.code}</Td>
                      <Td className="text-right">{formatNumber(r.value)} {(r.readingType as MeterType) === "KM" ? "km" : "hrs"}</Td>
                      <Td><Badge tone={r.source === "FUEL_ISSUE" ? "amber" : "slate"}>{r.source === "FUEL_ISSUE" ? "Fuel issue" : "Manual"}</Badge></Td>
                      <Td className="text-slate-500">{(r.readingType as MeterType) === "KM" ? "Odometer" : "Hour-meter"}</Td>
                      <Td className="text-slate-500">{r.recordedBy.name}</Td>
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
