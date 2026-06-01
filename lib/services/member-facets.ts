import { prisma } from "@/lib/prisma";

export type MemberFilterFacets = {
  divisions: string[];
  districts: string[];
  stations: string[];
};

export async function getMemberFilterFacets(): Promise<MemberFilterFacets> {
  const [divisions, districts, stations] = await Promise.all([
    prisma.member.groupBy({
      by: ["division"],
      orderBy: { division: "asc" },
    }),
    prisma.member.groupBy({
      by: ["district"],
      orderBy: { district: "asc" },
    }),
    prisma.member.groupBy({
      by: ["station"],
      orderBy: { station: "asc" },
    }),
  ]);

  return {
    divisions: divisions.map((r) => r.division.trim()).filter(Boolean),
    districts: districts.map((r) => r.district.trim()).filter(Boolean),
    stations: stations.map((r) => r.station.trim()).filter(Boolean),
  };
}
