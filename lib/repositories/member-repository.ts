import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function findMembers(params: {
  where: Prisma.MemberWhereInput;
  skip: number;
  take: number;
  orderBy: Prisma.MemberOrderByWithRelationInput;
}): Promise<{ items: Awaited<ReturnType<typeof prisma.member.findMany>>; total: number }> {
  const [items, total] = await prisma.$transaction([
    prisma.member.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy,
    }),
    prisma.member.count({ where: params.where }),
  ]);
  return { items, total };
}

export async function findMemberById(id: string) {
  return prisma.member.findUnique({ where: { id } });
}

export async function createMember(data: Prisma.MemberCreateInput) {
  return prisma.member.create({ data });
}

export async function updateMember(id: string, data: Prisma.MemberUpdateInput) {
  return prisma.member.update({ where: { id }, data });
}

export async function deleteMember(id: string) {
  return prisma.member.delete({ where: { id } });
}
