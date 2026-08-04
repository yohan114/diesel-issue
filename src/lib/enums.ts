import { z } from "zod";

// SQLite has no native enums; these are the single source of truth for the
// string-constrained columns, used both for Zod validation and display labels.

export const ROLES = ["ADMIN", "USER"] as const;
export type Role = (typeof ROLES)[number];
export const roleSchema = z.enum(ROLES);

export const METER_TYPES = ["KM", "HOURS"] as const;
export type MeterType = (typeof METER_TYPES)[number];
export const meterTypeSchema = z.enum(METER_TYPES);
export const METER_LABELS: Record<MeterType, string> = { KM: "Kilometres", HOURS: "Running hours" };
export const METER_UNIT: Record<MeterType, "km" | "hrs"> = { KM: "km", HOURS: "hrs" };

export const FUEL_KINDS = ["AUTO_DIESEL", "SUPER_DIESEL"] as const;
export type FuelKind = (typeof FUEL_KINDS)[number];
export const fuelKindSchema = z.enum(FUEL_KINDS);
export const FUEL_LABELS: Record<FuelKind, string> = {
  AUTO_DIESEL: "Lanka Auto Diesel",
  SUPER_DIESEL: "Lanka Super Diesel (Euro 4)",
};
export const FUEL_SHORT: Record<FuelKind, string> = {
  AUTO_DIESEL: "Diesel",
  SUPER_DIESEL: "Super Diesel",
};

export const REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export const requestStatusSchema = z.enum(REQUEST_STATUSES);

export const ASSET_STATUSES = ["ACTIVE", "INACTIVE", "DISPOSED"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];
export const assetStatusSchema = z.enum(ASSET_STATUSES);

export const PRICE_SOURCES = ["CEYPETCO", "AGGREGATOR", "MANUAL"] as const;
export type PriceSource = (typeof PRICE_SOURCES)[number];

export function efficiencyLabelFromMeter(meterType: MeterType): string {
  return meterType === "KM" ? "km/L" : "L/hr";
}

export const FLEET_GROUPS = ["ROAD_VEHICLE", "MACHINERY_GENSET"] as const;
export type FleetGroup = (typeof FLEET_GROUPS)[number];
export const FLEET_GROUP_LABELS: Record<FleetGroup, string> = {
  ROAD_VEHICLE: "Road Vehicle",
  MACHINERY_GENSET: "Machinery / Genset",
};
