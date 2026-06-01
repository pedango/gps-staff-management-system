import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConversationId } from "@/lib/conversation";
import { DmThreadClient } from "@/components/dm/DmThreadClient";

type PageProps = { params: Promise<{ adminId: string }> };

export default async function DmThreadPage({ params }: PageProps) {
  const { adminId } = await params;
  const session = await auth();
  const selfId = session?.user?.id;
  if (!selfId) {
    notFound();
  }
  if (adminId === selfId) {
    notFound();
  }

  const peer = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, name: true, email: true, avatar: true, role: true, createdAt: true },
  });
  if (!peer) {
    notFound();
  }

  const conversationId = getConversationId(selfId, peer.id);

  const self = await prisma.admin.findUnique({
    where: { id: selfId },
    select: { name: true, email: true, avatar: true },
  });

  return (
    <DmThreadClient
      selfId={selfId}
      selfName={self?.name ?? session.user?.name ?? "Admin"}
      selfEmail={self?.email ?? ""}
      selfAvatar={self?.avatar ?? null}
      peer={peer}
      conversationId={conversationId}
    />
  );
}
