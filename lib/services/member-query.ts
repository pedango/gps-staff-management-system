import type { Department, MemberStatus, Prisma } from "@prisma/client";

export type MemberListFilters = {
  name?: string;
  contact?: string;
  district?: string;
  division?: string;
  station?: string;
  status?: MemberStatus;
  department?: Department;
};

export function buildMemberWhere(filters: MemberListFilters): Prisma.MemberWhereInput {
  const name = filters.name?.trim();
  const contact = filters.contact?.trim();
  const district = filters.district?.trim();
  const division = filters.division?.trim();
  const station = filters.station?.trim();

  const and: Prisma.MemberWhereInput[] = [];

  if (name) {
    and.push({
      OR: [
        { firstName: { contains: name, mode: "insensitive" } },
        { lastName: { contains: name, mode: "insensitive" } },
        { otherNames: { contains: name, mode: "insensitive" } },
      ],
    });
  }
  if (contact) {
    and.push({ contact: { contains: contact, mode: "insensitive" } });
  }
  if (district) {
    and.push({ district: { contains: district, mode: "insensitive" } });
  }
  if (division) {
    and.push({ division: { contains: division, mode: "insensitive" } });
  }
  if (station) {
    and.push({ station: { contains: station, mode: "insensitive" } });
  }
  if (filters.status) {
    and.push({ status: filters.status });
  }
  if (filters.department) {
    and.push({ department: filters.department });
  }

  if (and.length === 0) {
    return {};
  }
  return { AND: and };
}
