import { NextResponse } from "next/server";
import type { Department, MemberStatus, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { memberSchema } from "@/lib/validations/member.schema";
import { buildMemberWhere, type MemberListFilters } from "@/lib/services/member-query";
import { createMember, findMembers } from "@/lib/repositories/member-repository";
import { getCached, invalidateMembersListCache, membersListCacheKey, setCached } from "@/lib/redis";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const SORT_FIELDS = ["lastName", "firstName", "rank", "department", "district", "station", "status", "createdAt"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function parseFilters(sp: URLSearchParams): MemberListFilters {
  const statusRaw = sp.get("status");
  const deptRaw = sp.get("department");
  return {
    name: sp.get("name") ?? undefined,
    contact: sp.get("contact") ?? undefined,
    district: sp.get("district") ?? undefined,
    division: sp.get("division") ?? undefined,
    station: sp.get("station") ?? undefined,
    status: statusRaw ? (statusRaw as MemberStatus) : undefined,
    department: deptRaw ? (deptRaw as Department) : undefined,
  };
}

function parseOrderBy(sp: URLSearchParams): Prisma.MemberOrderByWithRelationInput {
  const sort = sp.get("sort") as SortField | null;
  const dir = sp.get("dir") === "desc" ? "desc" : "asc";
  const field: SortField = sort && SORT_FIELDS.includes(sort) ? sort : "lastName";
  return { [field]: dir };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const sp = url.searchParams;
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(sp.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
  );

  const filters = parseFilters(sp);
  const where = buildMemberWhere(filters);
  const orderBy = parseOrderBy(sp);
  const cacheKey = membersListCacheKey(`${url.search}`);

  const cached = await getCached<{
    items: Awaited<ReturnType<typeof findMembers>>["items"];
    total: number;
    page: number;
    pageSize: number;
  }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const skip = (page - 1) * pageSize;
  const { items, total } = await findMembers({ where, skip, take: pageSize, orderBy });
  const payload = { items, total, page, pageSize };
  await setCached(cacheKey, payload, 60);
  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json: unknown = await req.json();
  const parsed = memberSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const member = await createMember({
    firstName: data.firstName,
    lastName: data.lastName,
    otherNames: data.otherNames,
    dob: data.dob,
    sex: data.sex,
    rank: data.rank,
    contact: data.contact,
    department: data.department,
    division: data.division,
    district: data.district,
    station: data.station,
    status: data.status,
    photo: data.photo,
  });
  await invalidateMembersListCache();
  return NextResponse.json(member, { status: 201 });
}
