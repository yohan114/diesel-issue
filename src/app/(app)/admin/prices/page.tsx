import { RefreshCw, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { latestPrices } from "@/lib/pricing";
import { refreshPricesNow } from "@/server/actions/prices";
import { PageHeader } from "@/components/layout/page-header";
import { CollapsibleCard } from "@/components/layout/collapsible-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, Th, Tr, Td, TableScroll, EmptyRow } from "@/components/ui/table";
import { AddPriceForm } from "@/components/forms/add-price-form";
import { ActionButton } from "@/components/forms/action-button";
import { formatLKR } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { FUEL_LABELS, type FuelKind } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function PricesPage() {
  const [prices, history, lastRefresh, lastError] = await Promise.all([
    latestPrices(),
    db.fuelPrice.findMany({ orderBy: { effectiveFrom: "desc" }, take: 50, include: { enteredBy: { select: { name: true } } } }),
    db.setting.findUnique({ where: { key: "price.lastRefreshAt" } }),
    db.setting.findUnique({ where: { key: "price.lastRefreshError" } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Fuel Prices" subtitle="Diesel & super-diesel prices in LKR. Manual entry is the source of truth.">
        <ActionButton action={refreshPricesNow} variant="outline" pendingText="Checking…">
          <RefreshCw className="h-4 w-4" /> Refresh from Ceypetco
        </ActionButton>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(Object.keys(FUEL_LABELS) as FuelKind[]).map((k) => (
          <Card key={k}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{FUEL_LABELS[k]}</p>
                <p className="text-2xl font-semibold text-slate-900">{prices[k] ? `${formatLKR(prices[k]!.pricePerLitre)}/L` : "Not set"}</p>
                {prices[k] && <p className="text-xs text-slate-400">since {formatDate(prices[k]!.effectiveFrom)} · {prices[k]!.source}</p>}
              </div>
              <Badge tone={k === "SUPER_DIESEL" ? "violet" : "amber"}>{k === "SUPER_DIESEL" ? "Super" : "Diesel"}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {lastError && !lastRefresh && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Automatic refresh couldn’t reach Ceypetco (the site blocks bots). Enter prices manually below.
        </div>
      )}
      {lastRefresh && <p className="text-xs text-slate-400">Last automatic refresh: {formatDateTime(lastRefresh.value)}</p>}

      <CollapsibleCard title="Add / override price">
        <AddPriceForm />
      </CollapsibleCard>

      <Card>
        <CardHeader><CardTitle>Price history</CardTitle></CardHeader>
        <CardContent className="p-0">
          <TableScroll>
            <Table className="min-w-[560px]">
              <THead>
                <tr><Th>Effective from</Th><Th>Fuel</Th><Th className="text-right">Price/L</Th><Th>Source</Th><Th>Entered by</Th></tr>
              </THead>
              <tbody>
                {history.length === 0 ? (
                  <EmptyRow colSpan={5}>No prices recorded.</EmptyRow>
                ) : (
                  history.map((p) => (
                    <Tr key={p.id}>
                      <Td>{formatDate(p.effectiveFrom)}</Td>
                      <Td><Badge tone={p.fuelKind === "SUPER_DIESEL" ? "violet" : "amber"}>{p.fuelKind === "SUPER_DIESEL" ? "Super" : "Diesel"}</Badge></Td>
                      <Td className="text-right font-medium text-slate-900">{formatLKR(p.pricePerLitre)}</Td>
                      <Td className="text-slate-500">{p.source}</Td>
                      <Td className="text-slate-500">{p.enteredBy?.name ?? "system"}</Td>
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
