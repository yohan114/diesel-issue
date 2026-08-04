import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Table, THead, Th, Tr, Td, TableScroll, EmptyRow } from "@/components/ui/table";
import { inputClasses } from "@/components/ui/field";
import { buttonClasses } from "@/components/ui/button";
import { ASSET_STATUSES, METER_TYPES, type MeterType } from "@/lib/enums";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SP = { q?: string; category?: string; meter?: string; status?: string; page?: string };

export default async function FleetPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const where: Prisma.AssetWhereInput = {};
  if (q) {
    const up = q.toUpperCase();
    where.OR = [
      { code: { contains: up } },
      { regNo: { contains: up } },
      { brand: { contains: up } },
      { typeLabel: { contains: q } },
    ];
  }
  if (sp.category) where.categoryId = sp.category;
  if (sp.meter) where.meterType = sp.meter;
  if (sp.status) where.status = sp.status;

  const [categories, total, assets] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.asset.count({ where }),
    db.asset.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { code: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const mkHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sp.category) params.set("category", sp.category);
    if (sp.meter) params.set("meter", sp.meter);
    if (sp.status) params.set("status", sp.status);
    params.set("page", String(p));
    return `/fleet?${params.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Fleet" subtitle={`${total} asset${total === 1 ? "" : "s"} matching`} />

      <Card>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} placeholder="Search code, reg no, brand…" className={`${inputClasses} pl-9`} />
            </div>
            <select name="category" defaultValue={sp.category ?? ""} className={inputClasses}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select name="meter" defaultValue={sp.meter ?? ""} className={inputClasses}>
              <option value="">All meters</option>
              {METER_TYPES.map((m) => (
                <option key={m} value={m}>{m === "KM" ? "Kilometres" : "Hours"}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <select name="status" defaultValue={sp.status ?? ""} className={inputClasses}>
                <option value="">All status</option>
                {ASSET_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="submit" className={buttonClasses("primary", "md")}>Filter</button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <TableScroll>
            <Table className="min-w-[720px]">
              <THead>
                <tr>
                  <Th>Code</Th>
                  <Th>Type</Th>
                  <Th>Brand</Th>
                  <Th>Reg No</Th>
                  <Th>Meter</Th>
                  <Th>YOM</Th>
                  <Th>Status</Th>
                </tr>
              </THead>
              <tbody>
                {assets.length === 0 ? (
                  <EmptyRow colSpan={7}>No assets match your filters.</EmptyRow>
                ) : (
                  assets.map((a) => (
                    <Tr key={a.id}>
                      <Td>
                        <Link href={`/fleet/${a.id}`} className="font-medium text-amber-600 hover:underline">{a.code}</Link>
                      </Td>
                      <Td>{a.category.name}</Td>
                      <Td className="text-slate-500">{a.brand ?? "—"}</Td>
                      <Td className="text-slate-500">{a.regNo ?? "—"}</Td>
                      <Td><Badge tone={(a.meterType as MeterType) === "KM" ? "blue" : "violet"}>{a.meterType === "KM" ? "km" : "hrs"}</Badge></Td>
                      <Td className="text-slate-500">{a.yom ?? "—"}</Td>
                      <Td><Badge tone={statusTone(a.status)}>{a.status}</Badge></Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableScroll>
        </CardContent>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={mkHref(page - 1)} className={buttonClasses("outline", "sm")}>Previous</Link>}
            {page < pages && <Link href={mkHref(page + 1)} className={buttonClasses("outline", "sm")}>Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
