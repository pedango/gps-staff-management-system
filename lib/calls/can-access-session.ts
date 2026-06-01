import { prisma } from "@/lib/prisma";

/** Any logged-in admin may join an active call via share link. */
export async function canAccessCallSession(sessionId: string): Promise<boolean> {
  const session = await prisma.callSession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });
  return Boolean(session && session.status === "ACTIVE");
}
