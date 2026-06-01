import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessCallSession } from "@/lib/calls/can-access-session";
import { serializeCallSession } from "@/lib/calls/serialize-session";
import { callParticipantSelect } from "@/lib/calls/session-select";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!(await canAccessCallSession(id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.callSession.findUnique({
    where: { id },
    include: {
      participants: { where: { leftAt: null }, select: callParticipantSelect },
    },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeCallSession(row));
}
