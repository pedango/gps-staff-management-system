import { NextResponse } from "next/server";
import type { FileType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getConversationId } from "@/lib/conversation";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { sendMessageSchema } from "@/lib/validations/message.schema";

const adminSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} as const;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json: unknown = await req.json();
  const parsed = sendMessageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const senderId = session.user.id;
  const { receiverId, text, fileUrl, fileType, fileName, voiceUrl, voiceDuration } = parsed.data;

  if (receiverId === senderId) {
    return NextResponse.json({ error: "Invalid receiver" }, { status: 400 });
  }

  const receiver = await prisma.admin.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
  }

  let prismaFileType: FileType | null = null;
  let prismaText: string | null = null;
  let prismaFileUrl: string | null = null;
  let prismaFileName: string | null = null;
  let prismaVoiceUrl: string | null = null;
  let prismaVoiceDuration: number | null = null;

  if (text) {
    prismaText = text;
  } else if (fileUrl && fileType) {
    prismaFileType = fileType;
    prismaFileUrl = fileUrl;
    prismaFileName = fileName ?? null;
  } else if (voiceUrl && voiceDuration != null) {
    prismaFileType = "VOICE";
    prismaVoiceUrl = voiceUrl;
    prismaVoiceDuration = voiceDuration;
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      text: prismaText,
      fileUrl: prismaFileUrl,
      fileType: prismaFileType,
      fileName: prismaFileName,
      voiceUrl: prismaVoiceUrl,
      voiceDuration: prismaVoiceDuration,
    },
    include: {
      sender: { select: adminSelect },
      receiver: { select: adminSelect },
    },
  });

  const conversationId = getConversationId(senderId, receiverId);
  if (pusherServer) {
    await pusherServer.trigger(`private-dm-${conversationId}`, "new-message", {
      message: {
        ...message,
        createdAt: message.createdAt.toISOString(),
        readAt: message.readAt?.toISOString() ?? null,
      },
    });
  }

  return NextResponse.json(message, { status: 201 });
}
