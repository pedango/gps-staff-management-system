import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPeerId } from "@/lib/conversation";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ conversationId: string }> };

const adminSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} as const;

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await ctx.params;
  const selfId = session.user.id;
  const peerId = getPeerId(conversationId, selfId);
  if (!peerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: selfId, receiverId: peerId },
        { senderId: peerId, receiverId: selfId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 500,
    include: {
      sender: { select: adminSelect },
      receiver: { select: adminSelect },
    },
  });

  return NextResponse.json(messages);
}
