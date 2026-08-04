import * as React from "react";

// Cosmetic gate only — hides admin controls in the UI. The server-side RBAC
// chokepoint (assertCan) is what actually enforces permissions.
export function AdminOnly({ role, children }: { role: string; children: React.ReactNode }) {
  return role === "ADMIN" ? <>{children}</> : null;
}
