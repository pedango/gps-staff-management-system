import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { serializeCallSession } from "@/lib/calls/serialize-session";
import { callParticipantSelect } from "@/lib/calls/session-select";
import { CallJoinClient } from "@/components/dm/CallJoinClient";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ sessionId: string }> };

export default async function CallJoinPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const row = await prisma.callSession.findUnique({
    where: { id: sessionId },
    include: {
      participants: { where: { leftAt: null }, select: callParticipantSelect },
    },
  });

  if (!row || row.status === "ENDED") {
    notFound();
  }

  const self = await prisma.admin.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, avatar: true },
  });
  if (!self) {
    notFound();
  }

  const callSession = serializeCallSession(row);

  return (
    <CallJoinClient
      session={callSession}
      selfId={self.id}
      selfName={self.name}
      selfEmail={self.email}
      selfAvatar={self.avatar}
    />
  );
}
