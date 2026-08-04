// Shared chart palette (client-safe — no server imports).
export const FUEL_COLORS: Record<"AUTO_DIESEL" | "SUPER_DIESEL", string> = {
  AUTO_DIESEL: "#f59e0b", // amber
  SUPER_DIESEL: "#6366f1", // indigo
};

export const CHART = {
  litres: "#f59e0b",
  cost: "#059669", // emerald
  grid: "#e2e8f0",
  axis: "#94a3b8",
};

export const CATEGORY_PALETTE = [
  "#f59e0b", "#6366f1", "#059669", "#0ea5e9", "#ef4444",
  "#8b5cf6", "#14b8a6", "#f97316", "#64748b", "#ec4899",
];
