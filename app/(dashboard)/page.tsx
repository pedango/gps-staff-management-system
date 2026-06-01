import { getDashboardStats } from "@/lib/services/dashboard-stats";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return (
    <DashboardClient
      initialStats={{
        ...stats,
        recent: stats.recent.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        })),
      }}
    />
  );
}
