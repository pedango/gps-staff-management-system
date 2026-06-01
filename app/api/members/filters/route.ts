import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMemberFilterFacets } from "@/lib/services/member-facets";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const facets = await getMemberFilterFacets();
  return NextResponse.json(facets);
}
