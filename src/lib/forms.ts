import type { ZodError } from "zod";

// Shared shape returned by server actions used with React's useActionState.
export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const idleState: ActionState = {};

export function zodFieldErrors(e: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// FormData helpers
export function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
export function optStr(fd: FormData, k: string): string | undefined {
  const v = str(fd, k);
  return v === "" ? undefined : v;
}
export function num(fd: FormData, k: string): number {
  return Number(str(fd, k));
}
