import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/dashboard-stats";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getDashboardStats();
  return NextResponse.json(stats);
}
