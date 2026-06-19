import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPeerId } from "@/lib/conversation";
import { deriveE2eeKey, e2eeKeyFingerprint } from "@/lib/livekit/e2ee";
import { prisma } from "@/lib/prisma";

/**
 * Records server-side proof that a participant enabled E2EE for a call.
 * The participant sends the fingerprint of the key it actually applied; the
 * server re-derives the conversation key and marks the record `verified` only
 * when the fingerprints match (i.e. the client genuinely held the right key).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { room?: string; keyFingerprint?: string; callType?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const room = body.room?.trim();
  const keyFingerprint = body.keyFingerprint?.trim();
  if (!room || !keyFingerprint) {
    return NextResponse.json({ error: "room and keyFingerprint required" }, { status: 400 });
  }
  if (!getPeerId(room, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiSecret) {
    return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 });
  }

  const expected = e2eeKeyFingerprint(deriveE2eeKey(apiSecret, room));
  const verified = keyFingerprint === expected;

  const record = await prisma.callEncryptionAudit.create({
    data: {
      conversationId: room,
      participantId: session.user.id,
      participantName: session.user.name ?? "Admin",
      callType: typeof body.callType === "string" ? body.callType : null,
      encrypted: true,
      keyFingerprint,
      verified,
      userAgent: req.headers.get("user-agent")?.slice(0, 256) ?? null,
    },
  });

  return NextResponse.json({ ok: true, verified, recordId: record.id });
}
