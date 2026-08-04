// All monetary values are stored as integer LKR cents to avoid float drift.
export const CURRENCY = "LKR";

export function rupeesToCents(rupees: number): number {
  return Math.round(rupees * 100);
}

export function centsToRupees(cents: number): number {
  return cents / 100;
}

// round(litres * pricePerLitreCents) -> total cost in cents
export function computeTotalCost(litres: number, pricePerLitreCents: number): number {
  return Math.round(litres * pricePerLitreCents);
}

// "Rs. 1,234.56"
export function formatLKR(cents: number): string {
  const rupees = cents / 100;
  return (
    "Rs. " +
    rupees.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

// Compact form for charts/cards: "Rs. 1.2M", "Rs. 45.0K"
export function formatLKRCompact(cents: number): string {
  const r = cents / 100;
  if (Math.abs(r) >= 1_000_000) return "Rs. " + (r / 1_000_000).toFixed(1) + "M";
  if (Math.abs(r) >= 1_000) return "Rs. " + (r / 1_000).toFixed(1) + "K";
  return "Rs. " + r.toFixed(0);
}
