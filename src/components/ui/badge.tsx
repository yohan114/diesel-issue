import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  slate: "bg-slate-100 text-slate-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "slate",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}

export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "APPROVED":
    case "ACTIVE":
      return "green";
    case "PENDING":
      return "amber";
    case "REJECTED":
    case "DISPOSED":
      return "red";
    case "INACTIVE":
      return "slate";
    default:
      return "slate";
  }
}
