import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessCallSession } from "@/lib/calls/can-access-session";
import { pusherServer } from "@/lib/pusher";
import { ROOM_CALL_EVENTS, type RoomCallEventName } from "@/lib/webrtc/call-events";

const ALLOWED = new Set<string>([
  ROOM_CALL_EVENTS.OFFER,
  ROOM_CALL_EVENTS.ANSWER,
  ROOM_CALL_EVENTS.ICE,
]);

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!pusherServer) {
    return NextResponse.json({ error: "Pusher is not configured" }, { status: 503 });
  }

  const { id: sessionId } = await context.params;
  if (!(await canAccessCallSession(sessionId))) {
    return NextResponse.json({ error: "Call has ended" }, { status: 410 });
  }

  let body: { event?: string; data?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event?.trim();
  const data = body.data;
  if (!event || !ALLOWED.has(event) || !data || typeof data !== "object") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const targetId = data.targetId;
  if (typeof targetId !== "string" || targetId.length > 64) {
    return NextResponse.json({ error: "Invalid targetId" }, { status: 400 });
  }

  await pusherServer.trigger(`private-call-${sessionId}`, event as RoomCallEventName, {
    ...data,
    sessionId,
    fromId: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
