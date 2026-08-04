import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ----------------------------- Dates -----------------------------

// Half-open [from, to) bounds for a given year + 1-based month, in local time.
export function monthBounds(year: number, month1to12: number): { from: Date; to: Date } {
  const from = new Date(year, month1to12 - 1, 1, 0, 0, 0, 0);
  const to = new Date(year, month1to12, 1, 0, 0, 0, 0);
  return { from, to };
}

export function currentYearMonth(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthLabel(year: number, month1to12: number): string {
  return `${MONTH_NAMES[month1to12 - 1]} ${year}`;
}

// YYYY-MM-DD for <input type="date"> and stable keys
export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// Last N months as {year, month} including the current one, oldest-first.
export function lastNMonths(n: number): Array<{ year: number; month: number }> {
  const out: Array<{ year: number; month: number }> = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ year: dd.getFullYear(), month: dd.getMonth() + 1 });
  }
  return out;
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString("en-LK", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
