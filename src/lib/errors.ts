// Application error with an HTTP status + stable code, safe to surface to clients.
export class AppError extends Error {
  status: number;
  code: string;
  constructor(code: string, status = 400, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = status;
    this.name = "AppError";
  }
}

// Normalize any thrown value into a user-facing { ok:false, error } shape.
export function toActionError(err: unknown): { ok: false; error: string; code: string } {
  if (err instanceof AppError) return { ok: false, error: err.message, code: err.code };
  if (err instanceof Error) return { ok: false, error: err.message, code: "ERROR" };
  return { ok: false, error: "Unexpected error", code: "ERROR" };
}
