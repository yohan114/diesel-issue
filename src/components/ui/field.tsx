import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClasses =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:bg-slate-50";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-medium text-slate-700", className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClasses, "h-auto py-2", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClasses, "appearance-none bg-white pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  return children ? <p className="mt-1 text-xs text-red-600">{children}</p> : null;
}

export function FormError({ children }: { children?: React.ReactNode }) {
  return children ? (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{children}</div>
  ) : null;
}

export function FormSuccess({ children }: { children?: React.ReactNode }) {
  return children ? (
    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{children}</div>
  ) : null;
}
