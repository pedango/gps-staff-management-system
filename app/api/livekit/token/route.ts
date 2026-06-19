import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { auth } from "@/lib/auth";
import { getPeerId } from "@/lib/conversation";
import { deriveE2eeKey } from "@/lib/livekit/e2ee";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { room?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const room = body.room?.trim();
  if (!room) {
    return NextResponse.json({ error: "room required" }, { status: 400 });
  }

  // Room name is the DM conversation id; only its two participants may join.
  if (!getPeerId(room, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !url) {
    return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: session.user.id,
    name: session.user.name ?? "Admin",
    ttl: "1h",
  });
  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  const e2eeKey = deriveE2eeKey(apiSecret, room);
  return NextResponse.json({ token, url, e2eeKey });
}
