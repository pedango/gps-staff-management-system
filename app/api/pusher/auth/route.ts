import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessCallSession } from "@/lib/calls/can-access-session";
import { getPeerId } from "@/lib/conversation";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!pusherServer) {
    return NextResponse.json({ error: "Pusher is not configured" }, { status: 503 });
  }

  const body = await req.formData();
  const socketId = String(body.get("socket_id") ?? "");
  const channelName = String(body.get("channel_name") ?? "");
  if (!socketId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (channelName.startsWith("private-dm-")) {
    const conversationId = channelName.slice("private-dm-".length);
    const peerId = getPeerId(conversationId, session.user.id);
    if (!peerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (channelName.startsWith("private-call-")) {
    const callSessionId = channelName.slice("private-call-".length);
    if (!(await canAccessCallSession(callSessionId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName);
  return NextResponse.json(authResponse);
}
