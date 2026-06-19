import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getConversationId } from "@/lib/conversation";
import { decryptNullable } from "@/lib/crypto/message-encryption";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const selfId = session.user.id;

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: selfId }, { receiverId: selfId }],
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
    include: {
      sender: { select: { id: true, name: true, email: true, avatar: true } },
      receiver: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  type Row = (typeof messages)[number];
  const latestByPeer = new Map<
    string,
    { last: Row; unread: number; conversationId: string; peer: { id: string; name: string; email: string; avatar: string | null } }
  >();

  for (const m of messages) {
    const peer = m.senderId === selfId ? m.receiver : m.sender;
    const existing = latestByPeer.get(peer.id);
    const unreadInc = m.receiverId === selfId && !m.readAt ? 1 : 0;
    if (!existing) {
      latestByPeer.set(peer.id, {
        last: m,
        unread: unreadInc,
        conversationId: getConversationId(selfId, peer.id),
        peer,
      });
    } else {
      existing.unread += unreadInc;
    }
  }

  const conversations = Array.from(latestByPeer.values())
    .sort((a, b) => b.last.createdAt.getTime() - a.last.createdAt.getTime())
    .map((c) => ({ ...c, last: { ...c.last, text: decryptNullable(c.last.text) } }));

  return NextResponse.json(conversations);
}
