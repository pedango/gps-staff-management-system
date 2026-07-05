import { create } from "zustand";
import { toast } from "sonner";
import { getConversationId } from "@/lib/conversation";
import { getPusherClient } from "@/lib/pusher-client";
import { emitCallSignal } from "@/lib/webrtc/emit-call-signal";
import { DM_CALL_EVENTS, type CallType } from "@/lib/webrtc/call-events";
import type { AdminPublic } from "@/types/admin";

export type ActiveCallState = {
  peer: AdminPublic;
  type: CallType;
  conversationId: string;
};

export type IncomingCallState = {
  peer: AdminPublic;
  type: CallType;
  fromName: string;
  conversationId: string;
};

type CallStore = {
  incoming: IncomingCallState | null;
  activeCall: ActiveCallState | null;
  setIncoming: (incoming: IncomingCallState | null) => void;
  startOutgoingCall: (peer: AdminPublic, type: CallType, selfId: string, selfName: string) => Promise<void>;
  acceptIncoming: () => void;
  declineIncoming: () => Promise<void>;
  closeActiveCall: () => Promise<void>;
  clearIncoming: () => void;
};

export const useCallStore = create<CallStore>((set, get) => ({
  incoming: null,
  activeCall: null,

  setIncoming: (incoming) => set({ incoming }),

  startOutgoingCall: async (peer, type, selfId, selfName) => {
    if (!getPusherClient()) {
      toast.error("Calls require live messaging (Pusher)");
      return;
    }
    if (get().activeCall) {
      return;
    }

    const conversationId = getConversationId(selfId, peer.id);
    set({
      activeCall: { peer, type, conversationId },
      incoming: null,
    });

    try {
      await emitCallSignal(conversationId, DM_CALL_EVENTS.INVITE, {
        callId: conversationId,
        sessionId: conversationId,
        type,
        fromName: selfName,
      });
    } catch {
      set({ activeCall: null });
      toast.error("Could not start call");
    }
  },

  acceptIncoming: () => {
    const incoming = get().incoming;
    if (!incoming) {
      return;
    }
    set({
      activeCall: {
        peer: incoming.peer,
        type: incoming.type,
        conversationId: incoming.conversationId,
      },
      incoming: null,
    });
  },

  declineIncoming: async () => {
    const incoming = get().incoming;
    if (!incoming) {
      return;
    }
    set({ incoming: null });
    try {
      await emitCallSignal(incoming.conversationId, DM_CALL_EVENTS.DECLINE, {
        callId: incoming.conversationId,
      });
    } catch {
      // Ignore signaling errors on decline.
    }
  },

  closeActiveCall: async () => {
    const activeCall = get().activeCall;
    if (!activeCall) {
      return;
    }
    set({ activeCall: null });
    try {
      await emitCallSignal(activeCall.conversationId, DM_CALL_EVENTS.END, {
        callId: activeCall.conversationId,
      });
    } catch {
      // Ignore signaling errors on hang up.
    }
  },

  clearIncoming: () => set({ incoming: null }),
}));

export function callsAreEnabled(): boolean {
  return Boolean(getPusherClient());
}
