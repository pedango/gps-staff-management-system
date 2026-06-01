import type { MemberStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardStats = {
  totalMembers: number;
  activeMembers: number;
  byDepartment: { department: string; _count: { _all: number } }[];
  byStatus: { status: string; _count: { _all: number } }[];
  recent: {
    id: string;
    firstName: string;
    lastName: string;
    otherNames: string | null;
    rank: string;
    department: string;
    status: MemberStatus;
    photo: string | null;
    createdAt: Date;
  }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalMembers, activeMembers, byDepartment, byStatus, recent] = await prisma.$transaction([
    prisma.member.count(),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.groupBy({ by: ["department"], _count: { _all: true }, orderBy: { department: "asc" } }),
    prisma.member.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.member.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        rank: true,
        department: true,
        status: true,
        photo: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalMembers,
    activeMembers,
    byDepartment: byDepartment as DashboardStats["byDepartment"],
    byStatus: byStatus as DashboardStats["byStatus"],
    recent,
  };
}
