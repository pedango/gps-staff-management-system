import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { ROOM_CALL_EVENTS } from "@/lib/webrtc/call-events";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await context.params;

  const callSession = await prisma.callSession.findUnique({
    where: { id: sessionId },
    select: { hostId: true, status: true },
  });
  if (!callSession || callSession.status === "ENDED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (callSession.hostId !== session.user.id) {
    return NextResponse.json({ error: "Only the host can end the call for everyone" }, { status: 403 });
  }

  await prisma.callParticipant.updateMany({
    where: { sessionId, leftAt: null },
    data: { leftAt: new Date() },
  });
  await prisma.callSession.update({
    where: { id: sessionId },
    data: { status: "ENDED", endedAt: new Date() },
  });

  if (pusherServer) {
    await pusherServer.trigger(`private-call-${sessionId}`, ROOM_CALL_EVENTS.SESSION_ENDED, {
      sessionId,
      fromId: session.user.id,
    });
  }

  return NextResponse.json({ ok: true });
}
