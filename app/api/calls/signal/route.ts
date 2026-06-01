import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPeerId } from "@/lib/conversation";
import { DM_CALL_EVENTS, type DmCallEventName } from "@/lib/webrtc/call-events";
import { pusherServer } from "@/lib/pusher";

const ALLOWED_EVENTS = new Set<string>(Object.values(DM_CALL_EVENTS));

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!pusherServer) {
    return NextResponse.json({ error: "Pusher is not configured" }, { status: 503 });
  }

  let body: { conversationId?: string; event?: string; data?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const conversationId = body.conversationId?.trim();
  const event = body.event?.trim();
  const data = body.data;

  if (!conversationId || !event || !ALLOWED_EVENTS.has(event) || !data || typeof data !== "object") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const peerId = getPeerId(conversationId, session.user.id);
  if (!peerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const callId = data.callId;
  if (typeof callId !== "string" || callId.length > 64) {
    return NextResponse.json({ error: "Invalid callId" }, { status: 400 });
  }
  if (event === DM_CALL_EVENTS.INVITE && typeof data.sessionId !== "string") {
    return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
  }

  const payload = {
    ...data,
    fromId: session.user.id,
  };
  if (event === DM_CALL_EVENTS.INVITE && typeof data.sessionId === "string") {
    (payload as Record<string, unknown>).sessionId = data.sessionId;
  }

  await pusherServer.trigger(`private-dm-${conversationId}`, event as DmCallEventName, payload);

  return NextResponse.json({ ok: true });
}
