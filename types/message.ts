import type { FileType, Message } from "@prisma/client";

export type MessageDTO = Message;

export type MessageWithParties = MessageDTO & {
  sender: { id: string; name: string; email: string; avatar: string | null };
  receiver: { id: string; name: string; email: string; avatar: string | null };
};

export type { FileType };
