import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalMembers, activeMembers, byDepartment, byStatus, recent] = await prisma.$transaction([
    prisma.member.count(),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.groupBy({ by: ["department"], _count: { _all: true } }),
    prisma.member.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.member.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        rank: true,
        photo: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    totalMembers,
    activeMembers,
    byDepartment,
    byStatus,
    recent,
  });
}
