import type { CallType } from "@/lib/webrtc/call-events";

export type CallParticipantPublic = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

export type CallSessionPublic = {
  id: string;
  hostId: string;
  conversationId: string | null;
  callType: CallType;
  status: "ACTIVE" | "ENDED";
  participants: CallParticipantPublic[];
  createdAt: string;
};

export function prismaCallTypeToClient(type: "AUDIO" | "VIDEO"): CallType {
  return type === "VIDEO" ? "video" : "audio";
}

export function clientCallTypeToPrisma(type: CallType): "AUDIO" | "VIDEO" {
  return type === "video" ? "VIDEO" : "AUDIO";
}
