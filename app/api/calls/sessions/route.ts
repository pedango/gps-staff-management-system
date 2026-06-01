import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { serializeCallSession } from "@/lib/calls/serialize-session";
import { callParticipantSelect } from "@/lib/calls/session-select";
import { clientCallTypeToPrisma } from "@/lib/calls/types";
import { getPeerId } from "@/lib/conversation";
import { prisma } from "@/lib/prisma";
import type { CallType } from "@/lib/webrtc/call-events";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { callType?: CallType; conversationId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const callType = body.callType === "video" ? "video" : body.callType === "audio" ? "audio" : null;
  if (!callType) {
    return NextResponse.json({ error: "callType required" }, { status: 400 });
  }

  const conversationId = body.conversationId?.trim() || null;
  if (conversationId && !getPeerId(conversationId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = await prisma.callSession.create({
    data: {
      hostId: session.user.id,
      conversationId,
      callType: clientCallTypeToPrisma(callType),
      participants: {
        create: { adminId: session.user.id },
      },
    },
    include: {
      participants: { where: { leftAt: null }, select: callParticipantSelect },
    },
  });

  return NextResponse.json(serializeCallSession(row));
}
