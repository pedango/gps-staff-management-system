import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/dashboard-stats";
import { getCached, setCached } from "@/lib/redis";
import { PerformanceConfig } from "@/src/config/performance";

const STATS_CACHE_KEY = "stats:dashboard";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cached = await getCached<Awaited<ReturnType<typeof getDashboardStats>>>(STATS_CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }

  const stats = await getDashboardStats();
  await setCached(STATS_CACHE_KEY, stats, PerformanceConfig.cache.defaultTTL);
  return NextResponse.json(stats);
}
