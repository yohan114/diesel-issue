import { db } from "./db";

// Best-effort audit trail. Never throws (auditing must not break a mutation).
export async function writeAudit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
  summary?: string,
  meta?: unknown,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: actorId ?? undefined,
        action,
        entity,
        entityId: entityId ?? undefined,
        summary,
        metaJson: meta !== undefined ? JSON.stringify(meta) : undefined,
      },
    });
  } catch {
    // swallow — auditing failures must not surface to the user
  }
}
