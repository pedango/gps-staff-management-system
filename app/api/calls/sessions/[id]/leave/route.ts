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

  await prisma.callParticipant.updateMany({
    where: { sessionId, adminId: session.user.id, leftAt: null },
    data: { leftAt: new Date() },
  });

  const remaining = await prisma.callParticipant.count({
    where: { sessionId, leftAt: null },
  });

  if (pusherServer) {
    await pusherServer.trigger(`private-call-${sessionId}`, ROOM_CALL_EVENTS.PARTICIPANT_LEFT, {
      sessionId,
      fromId: session.user.id,
    });

    if (remaining === 0) {
      await prisma.callSession.update({
        where: { id: sessionId },
        data: { status: "ENDED", endedAt: new Date() },
      });
      await pusherServer.trigger(`private-call-${sessionId}`, ROOM_CALL_EVENTS.SESSION_ENDED, {
        sessionId,
        fromId: session.user.id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
