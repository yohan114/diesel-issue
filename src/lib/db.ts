import { PrismaClient } from "@prisma/client";

// Singleton Prisma client (avoids exhausting connections on dev hot-reload).
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  __walConfigured?: boolean;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Enable WAL once so long-running cron/backup writes don't block reads.
if (!globalForPrisma.__walConfigured) {
  globalForPrisma.__walConfigured = true;
  db.$executeRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {});
  db.$executeRawUnsafe("PRAGMA busy_timeout=5000;").catch(() => {});
}
