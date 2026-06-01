"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
} from "recharts";
import { useSession } from "next-auth/react";
import {
  Activity,
  BarChart3,
  Building2,
  Download,
  MessageSquare,
  RefreshCw,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { APP_BRAND, LABEL_ADD_STAFF, LABEL_BROWSE_STAFFS, LABEL_STAFF, LABEL_STAFFS } from "@/lib/ui-labels";
import { dicebearInitialsUrl } from "@/lib/utils/dicebear";
import { departmentAbbrev, formatDepartmentLabel } from "@/lib/departments";
import { statusConfig } from "@/lib/member-status";
import { formatDisplayDate, formatMemberName } from "@/lib/utils/format";
import type { DashboardStats } from "@/lib/services/dashboard-stats";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import { cn } from "@/lib/utils/cn";

export type DashboardStatsSerialized = Omit<DashboardStats, "recent"> & {
  recent: (Omit<DashboardStats["recent"][number], "createdAt"> & { createdAt: string })[];
};

export type DashboardClientProps = {
  initialStats: DashboardStatsSerialized;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div className="rounded-xl border border-navy-100 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-navy-900">{label ?? row?.name}</div>
      <div className="text-navy-500">{row?.value ?? 0} {LABEL_STAFFS.toLowerCase()}</div>
    </div>
  );
}

function downloadDashboardCsv(stats: DashboardStatsSerialized) {
  const lines: string[] = [];
  lines.push("GPS — PMS dashboard export");
  lines.push(`Generated,${format(new Date(), "yyyy-MM-dd HH:mm")}`);
  lines.push("");
  lines.push("Metric,Value");
  lines.push(`Total personnel,${stats.totalMembers}`);
  lines.push(`Active & on duty,${stats.activeMembers}`);
  lines.push("");
  lines.push("Department,Count"); 
  for (const row of stats.byDepartment) {
    lines.push(`${row.department},${row._count._all}`);
  }
  lines.push("");
  lines.push("Status,Count");
  for (const row of stats.byStatus) {
    lines.push(`${row.status},${row._count._all}`);
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gps-pms-dashboard-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DashboardClient({ initialStats }: DashboardClientProps) {
  const { data: session } = useSession();
  const [deptFilter, setDeptFilter] = useState<string | "ALL">("ALL");
  const adminName = session?.user?.name ?? "Administrator";

  const {
    data: stats = initialStats,
    dataUpdatedAt,
    isError,
    error,
    refetch,
    isFetching,
    failureCount,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStatsSerialized> => {
      const res = await fetch("/api/stats", { credentials: "same-origin" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to load dashboard statistics.");
      }
      const body = (await res.json()) as unknown as DashboardStatsSerialized;
      return body;
    },
    initialData: initialStats,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const refetchStats = useCallback(() => {
    void refetch();
  }, [refetch]);

  const deptData = stats.byDepartment.map((d) => ({
    key: d.department,
    label: formatDepartmentLabel(d.department),
    count: d._count._all,
  }));

  const statusData = stats.byStatus.map((s) => ({
    key: s.status,
    label: statusConfig[s.status as keyof typeof statusConfig]?.label ?? s.status,
    count: s._count._all,
    fill: statusConfig[s.status as keyof typeof statusConfig]?.chartFill ?? "#94a3b8",
  }));

  const barData = useMemo(() => {
    if (deptFilter === "ALL") return deptData;
    return deptData.filter((d) => d.key === deptFilter);
  }, [deptData, deptFilter]);

  const topDept = deptData.reduce(
    (best, cur) => (cur.count > best.count ? cur : best),
    deptData[0] ?? { count: 0, label: "—", key: "" },
  );

  const topStatus = statusData.reduce(
    (best, cur) => (cur.count > best.count ? cur : best),
    statusData[0] ?? { count: 0, label: "—", key: "", fill: "#94a3b8" },
  );

  const deptAbbrevLabel = topDept.key && topDept.count > 0 ? departmentAbbrev(topDept.key) : "—";

  const statusTotal = statusData.reduce((s, r) => s + r.count, 0);
  const hasPersonnel = stats.totalMembers > 0;
  const lastUpdatedLabel = dataUpdatedAt
    ? `Updated ${formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}`
    : null;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = useMemo(() => {
    const base = adminName.trim().split(/\s+/)[0] ?? "Administrator";
    return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  }, [adminName]);

  const initials = (first: string, last: string) =>
    `${first.trim().slice(0, 1)}${last.trim().slice(0, 1)}`.toUpperCase() || "GP";

  const activePct =
    stats.totalMembers > 0 ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0;

  return (
    <div className="app-page dash-overview">
      {isError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            {error instanceof Error ? error.message : "Could not refresh dashboard data."} Showing last loaded values.
            {failureCount > 0 ? ` (${failureCount} failed attempt${failureCount > 1 ? "s" : ""})` : ""}
          </span>
          <Button
            type="button"
            onClick={() => void refetch()}
            className="h-9 shrink-0 rounded-lg border border-red-300 bg-white px-3 text-red-900 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="dashboard-toolbar dash-page-header">
        <div className="dashboard-toolbar-meta dash-page-header-left">
          <p className="dash-page-updated text-sm text-navy-400">
            Eastern North Region <span aria-hidden>·</span>{" "}
            <span className="font-semibold text-navy-600">{lastUpdatedLabel ?? "Updated just now"}</span>
          </p>
        </div>
        <div className="dashboard-toolbar-actions dash-page-header-right">
          <Link href="/members/add" className="dash-btn dash-btn-gold">
            <UserPlus className="h-4 w-4" aria-hidden />
            {LABEL_ADD_STAFF}
          </Link>
          <Link href="/members" className="dash-btn dash-btn-outline">
            {LABEL_BROWSE_STAFFS}
          </Link>
          <button
            type="button"
            className="dash-icon-btn"
            onClick={() => void refetchStats()}
            disabled={isFetching}
            aria-label="Refresh data"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} aria-hidden />
          </button>
          <button
            type="button"
            className="dash-icon-btn"
            onClick={() => downloadDashboardCsv(stats)}
            aria-label="Download report"
            title="Download report"
          >
            <Download className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="welcome-strip">
        <span className="welcome-strip-shape welcome-strip-shape-1" aria-hidden />
        <span className="welcome-strip-shape welcome-strip-shape-2" aria-hidden />
        <div className="welcome-strip-text">
          <p className="welcome-strip-greeting">
            {greeting}, {firstName} <span aria-hidden>👋</span>
          </p>
          <p className="welcome-strip-meta">Eastern North Region · {APP_BRAND} Staffs Management</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dicebearInitialsUrl(adminName)}
          alt=""
          className="welcome-strip-avatar"
          width={52}
          height={52}
        />
      </div>

      <div className="dash-stat-grid">
        <DashStatCard
          accent="blue"
          badge="Live"
          badgeClass="stat-badge-blue"
          icon={<Users aria-hidden />}
          decorIcon={<Users aria-hidden />}
          value={stats.totalMembers}
          label="Total Staff"
          subLabel={stats.totalMembers === 0 ? "No personnel on record yet" : "All registered records"}
        />
        <DashStatCard
          accent="green"
          badge="On Duty"
          badgeClass="stat-badge-green"
          icon={<UserCheck aria-hidden />}
          decorIcon={<UserCheck aria-hidden />}
          value={stats.activeMembers}
          label="Active & On Duty"
          subLabel={
            stats.totalMembers > 0
              ? `${activePct}% of total staffs`
              : `No ${LABEL_STAFFS.toLowerCase()} currently marked active`
          }
        />
        <DashStatCard
          accent="gold"
          badge="Headcount"
          badgeClass="stat-badge-gold"
          icon={<Building2 aria-hidden />}
          decorIcon={<Building2 aria-hidden />}
          value={deptAbbrevLabel}
          valueSmall
          label="Largest Department"
          subLabel={`${topDept.count} personnel in ${topDept.label}`}
        />
        <DashStatCard
          accent="purple"
          badge="Mix"
          badgeClass="stat-badge-purple"
          icon={<Activity aria-hidden />}
          decorIcon={<Activity aria-hidden />}
          value={topStatus.label}
          valueSmall
          label="Most Common Status"
          subLabel={`${topStatus.count} records`}
        />
      </div>

      {hasPersonnel ? (
        <div className="dept-filter-row">
          <span className="dept-label">Department</span>
          <button
            type="button"
            className={cn("dept-pill", deptFilter === "ALL" && "active")}
            onClick={() => setDeptFilter("ALL")}
          >
            All
          </button>
          {deptData
            .filter((d) => d.count > 0)
            .map((d) => (
              <button
                key={d.key}
                type="button"
                className={cn("dept-pill", deptFilter === d.key && "active")}
                onClick={() => setDeptFilter(d.key)}
                title={d.label}
              >
                {d.label} ({d.count})
              </button>
            ))}
        </div>
      ) : null}

      <div className="dash-charts-grid">
        <section className="chart-card" aria-labelledby="dept-chart-heading">
          <div className="chart-card-header">
            <div>
              <h3 id="dept-chart-heading" className="chart-card-title">
                {LABEL_STAFFS} by Department
              </h3>
              <p className="chart-card-subtitle">Distribution across GPS departments</p>
            </div>
            <span className="chart-card-filter">{deptFilter === "ALL" ? "All departments" : "Filtered"}</span>
          </div>
          <div className="chart-card-body">
            {hasPersonnel ? (
              <>
                <div className="chart-area" role="img" aria-label="Bar chart of member counts by department">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#e9ecf3" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} interval={0} angle={-22} textAnchor="end" height={72} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(245, 166, 35, 0.12)" }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#0d1f3c" activeBar={{ fill: "#f5a623" }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ChartDataTable
                  caption="Department counts (same data as chart)"
                  rows={barData.map((d) => ({ name: d.label, value: d.count }))}
                />
              </>
            ) : (
              <ChartEmpty
                title="No distribution to show yet"
                description="Add members to see headcount by department. Charts update automatically after each save."
              />
            )}
          </div>
        </section>

        <section className="chart-card" aria-labelledby="status-chart-heading">
          <div className="chart-card-header">
            <div>
              <h3 id="status-chart-heading" className="chart-card-title">
                {LABEL_STAFFS} by Status
              </h3>
              <p className="chart-card-subtitle">Current personnel status mix</p>
            </div>
            <span className="chart-card-filter">All statuses</span>
          </div>
          <div className="chart-card-body">
            {statusTotal > 0 ? (
              <>
                <div className="chart-area chart-area-pie" role="img" aria-label="Donut chart of members by status">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2}>
                        {statusData.map((entry) => (
                          <Cell key={entry.key} fill={entry.fill} stroke="#fff" strokeWidth={1} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-pie-center" aria-hidden>
                    <div className="chart-pie-center-value">{statusTotal}</div>
                    <div className="chart-pie-center-label">Total</div>
                  </div>
                </div>
                <div className="chart-legend">
                  {statusData.map((s) => (
                    <div key={s.key} className="chart-legend-item">
                      <span className="chart-legend-swatch" style={{ backgroundColor: s.fill }} aria-hidden />
                      <span>{s.label}</span>
                      <span className="chart-legend-count">({s.count})</span>
                    </div>
                  ))}
                </div>
                <ChartDataTable
                  caption="Status counts (same data as chart)"
                  rows={statusData.map((s) => ({ name: s.label, value: s.count }))}
                />
              </>
            ) : (
              <ChartEmpty
                title="No status mix yet"
                description="Once personnel records exist, this chart shows how members are distributed across duty statuses."
              />
            )}
          </div>
        </section>
      </div>

      <div className="quick-actions">
        <Link href="/members/add" className="quick-action-btn primary">
          <UserPlus className="h-4 w-4" aria-hidden />
          {LABEL_ADD_STAFF}
        </Link>
        <Link href="/members" className="quick-action-btn">
          <Users className="h-4 w-4" aria-hidden />
          {LABEL_BROWSE_STAFFS}
        </Link>
        <Link href="/dm" className="quick-action-btn">
          <MessageSquare className="h-4 w-4" aria-hidden />
          Message Admin
        </Link>
        <button type="button" className="quick-action-btn" onClick={() => downloadDashboardCsv(stats)}>
          <Download className="h-4 w-4" aria-hidden />
          Download Report
        </button>
      </div>

      <section className="dash-recent-card" aria-labelledby="recent-heading">
        <div className="dash-recent-header">
          <div>
            <h3 id="recent-heading" className="chart-card-title">
              Recently Added Staff
            </h3>
            <p className="chart-card-subtitle">Latest member registrations</p>
          </div>
          <Link href="/members" className="dash-recent-link">
            View All →
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-14 w-14 text-navy-200" strokeWidth={1.25} aria-hidden />}
            title="No recent additions"
            description="New members will appear here in order of registration. Start by adding your first personnel record."
            action={
              <Link href="/members/add" className="app-btn app-btn-gold">
                Add member
              </Link>
            }
          />
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">{LABEL_STAFF}</th>
                  <th scope="col">Rank &amp; Department</th>
                  <th scope="col">Status</th>
                  <th scope="col">Added</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/members/${m.id}`} className="dash-table-member">
                        <span className="dash-table-avatar">
                          {m.photo ? (
                            <Image src={m.photo} alt="" fill className="object-cover" sizes="40px" />
                          ) : (
                            <span className="dash-table-initials">{initials(m.firstName, m.lastName)}</span>
                          )}
                        </span>
                        <span className="dash-table-name">{formatMemberName(m.firstName, m.lastName, m.otherNames)}</span>
                      </Link>
                    </td>
                    <td>
                      <span className="dash-table-rank">{m.rank}</span>
                      <span className="dash-table-dept">{formatDepartmentLabel(m.department)}</span>
                    </td>
                    <td>
                      <MemberStatusBadge status={m.status} />
                    </td>
                    <td className="dash-table-date">{formatDisplayDate(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="dash-audit-note">
        Sensitive sign-ins and administrative changes are logged for audit. Access is subject to Ghana Police Service
        information security policy.
      </p>
    </div>
  );
}

function DashStatCard({
  accent,
  badge,
  badgeClass,
  icon,
  decorIcon,
  value,
  label,
  subLabel,
  valueSmall,
}: {
  accent: "blue" | "green" | "gold" | "purple";
  badge: string;
  badgeClass: string;
  icon: ReactNode;
  decorIcon: ReactNode;
  value: ReactNode;
  label: string;
  subLabel: string;
  valueSmall?: boolean;
}) {
  return (
    <div className={cn("stat-card", `stat-card--${accent}`)}>
      <div className="stat-card-top">
        <span className="stat-card-icon-wrap">{icon}</span>
        <span className={cn("stat-card-badge", badgeClass)}>{badge}</span>
      </div>
      <div className={cn("stat-card-value", valueSmall && "stat-card-value--sm")}>{value}</div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-sublabel">{subLabel}</div>
      <span className="stat-card-decor" aria-hidden>
        {decorIcon}
      </span>
    </div>
  );
}

function ChartEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="chart-empty" role="status">
      <BarChart3 className="h-12 w-12 text-navy-300" strokeWidth={1.25} aria-hidden />
      <p className="chart-empty-title">{title}</p>
      <p className="chart-empty-desc">{description}</p>
      <Link href="/members/add" className="app-btn app-btn-gold mt-6">
        Add member
      </Link>
    </div>
  );
}

function ChartDataTable({ caption, rows }: { caption: string; rows: { name: string; value: number }[] }) {
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
