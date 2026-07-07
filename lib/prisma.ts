import { PrismaClient } from "@prisma/client";
import { PerformanceConfig } from "@/src/config/performance";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function tunedDatabaseUrl(): string | undefined {
  const base = process.env.DATABASE_URL;
  if (!base) return base;
  const url = new URL(base);
  url.searchParams.set("connection_limit", String(PerformanceConfig.prisma.poolSize));
  return url.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: tunedDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
