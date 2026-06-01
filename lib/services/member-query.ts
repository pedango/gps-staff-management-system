import type { MemberStatus, Prisma } from "@prisma/client";
import { MEMBER_STATUS_VALUES } from "@/lib/member-filter-options";

export type MemberListFilters = {
  q?: string;
  statuses?: string[];
  departments?: string[];
  divisions?: string[];
  districts?: string[];
  stations?: string[];
};

export function buildMemberWhere(filters: MemberListFilters): Prisma.MemberWhereInput {
  const q = filters.q?.trim();
  const statuses = (filters.statuses ?? []).map((v) => v.trim()).filter(Boolean);
  const departments = (filters.departments ?? []).map((v) => v.trim()).filter(Boolean);
  const divisions = (filters.divisions ?? []).map((v) => v.trim()).filter(Boolean);
  const districts = (filters.districts ?? []).map((v) => v.trim()).filter(Boolean);
  const stations = (filters.stations ?? []).map((v) => v.trim()).filter(Boolean);
  const validStatuses = statuses.filter((s): s is MemberStatus =>
    (MEMBER_STATUS_VALUES as readonly string[]).includes(s),
  );
  const qStatusCandidates: MemberStatus[] = q
    ? MEMBER_STATUS_VALUES.filter((s) => s.toLowerCase().includes(q.toLowerCase().replace(/\s+/g, "_")))
    : [];

  const and: Prisma.MemberWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { otherNames: { contains: q, mode: "insensitive" } },
        { rank: { contains: q, mode: "insensitive" } },
        { station: { contains: q, mode: "insensitive" } },
        { district: { contains: q, mode: "insensitive" } },
        { division: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { contact: { contains: q, mode: "insensitive" } },
        ...(qStatusCandidates.length > 0 ? [{ status: { in: qStatusCandidates } }] : []),
        {
          AND: [
            { firstName: { contains: q.split(" ")[0] ?? q, mode: "insensitive" } },
            { lastName: { contains: q.split(" ").slice(1).join(" ") || q, mode: "insensitive" } },
          ],
        },
      ],
    });
  }
  if (statuses.length > 0 && validStatuses.length === 0) {
    and.push({ id: { equals: "__none__" } });
  }
  if (validStatuses.length > 0) {
    and.push({ status: { in: validStatuses } });
  }
  if (departments.length > 0) {
    and.push({ department: { in: departments } });
  }
  if (divisions.length > 0) {
    and.push({ division: { in: divisions } });
  }
  if (districts.length > 0) {
    and.push({ district: { in: districts } });
  }
  if (stations.length > 0) {
    and.push({ station: { in: stations } });
  }

  if (and.length === 0) {
    return {};
  }
  return { AND: and };
}
