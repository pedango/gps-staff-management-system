import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessCallSession } from "@/lib/calls/can-access-session";
import { serializeCallSession } from "@/lib/calls/serialize-session";
import { callParticipantSelect } from "@/lib/calls/session-select";
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
  if (!(await canAccessCallSession(sessionId))) {
    return NextResponse.json({ error: "Call has ended" }, { status: 410 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, avatar: true },
  });
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.callParticipant.findUnique({
    where: { sessionId_adminId: { sessionId, adminId: admin.id } },
  });

  if (existing?.leftAt) {
    await prisma.callParticipant.update({
      where: { id: existing.id },
      data: { leftAt: null, joinedAt: new Date() },
    });
  } else if (!existing) {
    await prisma.callParticipant.create({
      data: { sessionId, adminId: admin.id },
    });
  }

  const row = await prisma.callSession.findUnique({
    where: { id: sessionId },
    include: {
      participants: { where: { leftAt: null }, select: callParticipantSelect },
    },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (pusherServer) {
    await pusherServer.trigger(`private-call-${sessionId}`, ROOM_CALL_EVENTS.PARTICIPANT_JOINED, {
      sessionId,
      fromId: admin.id,
      participant: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
      },
    });
  }

  return NextResponse.json(serializeCallSession(row));
}
