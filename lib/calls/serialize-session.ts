import type { CallSessionPublic } from "@/lib/calls/types";
import { prismaCallTypeToClient } from "@/lib/calls/types";

type Row = {
  id: string;
  hostId: string;
  conversationId: string | null;
  callType: "AUDIO" | "VIDEO";
  status: "ACTIVE" | "ENDED";
  createdAt: Date;
  participants: {
    adminId: string;
    leftAt: Date | null;
    admin: { id: string; name: string; email: string; avatar: string | null };
  }[];
};

export function serializeCallSession(row: Row): CallSessionPublic {
  return {
    id: row.id,
    hostId: row.hostId,
    conversationId: row.conversationId,
    callType: prismaCallTypeToClient(row.callType),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    participants: row.participants
      .filter((p) => !p.leftAt)
      .map((p) => ({
        id: p.admin.id,
        name: p.admin.name,
        email: p.admin.email,
        avatar: p.admin.avatar,
      })),
  };
}
