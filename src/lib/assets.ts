import { db } from "./db";
import type { MeterType } from "./enums";
import type { AssetOption } from "@/components/forms/asset-select";

// Lightweight asset list for pickers (active assets only).
export async function getAssetOptions(): Promise<AssetOption[]> {
  const rows = await db.asset.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, code: true, meterType: true, category: { select: { name: true } } },
    orderBy: { code: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    category: r.category.name,
    meterType: r.meterType as MeterType,
  }));
}
