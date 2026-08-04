import { db } from "./db";
import { AppError } from "./errors";
import { readSessionClaims } from "./auth";
import { can, type Action } from "./permissions";
import type { Role } from "./enums";

export type { Action };

export type CurrentUser = {
  id: string;
  username: string;
  name: string;
  role: Role;
};

// Resolve the session AND re-check role/active against the DB (never trust the
// JWT alone for authorization decisions).
export async function getSessionUser(): Promise<CurrentUser | null> {
  const claims = await readSessionClaims();
  if (!claims) return null;
  const u = await db.user.findUnique({ where: { id: claims.sub } });
  if (!u || !u.active) return null;
  return { id: u.id, username: u.username, name: u.name, role: u.role as Role };
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await getSessionUser();
  if (!u) throw new AppError("UNAUTHENTICATED", 401, "Please sign in to continue.");
  return u;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== "ADMIN") throw new AppError("FORBIDDEN", 403, "Administrator access required.");
  return u;
}

// The single authorization chokepoint — every mutating server action calls it
// first, so a USER is structurally unable to edit, delete, or approve anything.
export async function assertCan(action: Action): Promise<CurrentUser> {
  const u = await requireUser();
  if (!can(u.role, action)) {
    throw new AppError(
      "FORBIDDEN",
      403,
      action === "create"
        ? "Your account cannot perform this action."
        : "Your account is add-only — only an administrator can edit, delete or approve records.",
    );
  }
  return u;
}
