import type { MemberStatus } from "@prisma/client";

export const statusConfig: Record<
  MemberStatus,
  {
    label: string;
    badgeClass: string;
    badgeDotClass: string;
    chartFill: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    badgeClass: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    badgeDotClass: "bg-emerald-500",
    chartFill: "#1a7a4a",
  },
  SICK: {
    label: "Sick",
    badgeClass: "border border-amber-200 bg-amber-50 text-amber-700",
    badgeDotClass: "bg-amber-500",
    chartFill: "#d97706",
  },
  INJURED: {
    label: "Injured",
    badgeClass: "border border-orange-200 bg-orange-50 text-orange-700",
    badgeDotClass: "bg-orange-500",
    chartFill: "#ea580c",
  },
  MATERNITY_LEAVE: {
    label: "Maternity Leave",
    badgeClass: "border border-purple-200 bg-purple-50 text-purple-700",
    badgeDotClass: "bg-purple-500",
    chartFill: "#9333ea",
  },
  RETIRED: {
    label: "Retired",
    badgeClass: "border border-slate-200 bg-slate-50 text-slate-500",
    badgeDotClass: "bg-slate-400",
    chartFill: "#64748b",
  },
};
