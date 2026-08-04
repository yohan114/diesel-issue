import type { Role } from "./enums";

// The permission matrix — intentionally dependency-free so it can be unit
// tested in isolation. USER is ADD-ONLY: it may create operational records
// (fuel requests/issues/readings) but can never update, delete, approve, or
// manage. ADMIN can do everything.
export type Action = "create" | "update" | "delete" | "approve" | "manage";

const MATRIX: Record<Role, ReadonlySet<Action>> = {
  ADMIN: new Set<Action>(["create", "update", "delete", "approve", "manage"]),
  USER: new Set<Action>(["create"]),
};

export function can(role: Role, action: Action): boolean {
  return MATRIX[role]?.has(action) ?? false;
}
