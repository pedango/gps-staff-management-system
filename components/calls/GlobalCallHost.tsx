"use client";

import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { IncomingCallIsland } from "@/components/calls/IncomingCallIsland";
import { LiveKitCall } from "@/components/dm/LiveKitCall";
import { getConversationId } from "@/lib/conversation";
import { acquireDmChannel, releaseDmChannel } from "@/lib/pusher-channel";
import { getPusherClient } from "@/lib/pusher-client";
import { DM_CALL_EVENTS, type CallInvitePayload } from "@/lib/webrtc/call-events";
import { useCallStore } from "@/stores/callStore";
import type { AdminPublic } from "@/types/admin";

export function GlobalCallHost() {
  const { data: session } = useSession();
  const selfId = session?.user?.id ?? "";

  const incoming = useCallStore((s) => s.incoming);
  const activeCall = useCallStore((s) => s.activeCall);
  const setIncoming = useCallStore((s) => s.setIncoming);
  const acceptIncoming = useCallStore((s) => s.acceptIncoming);
  const declineIncoming = useCallStore((s) => s.declineIncoming);
  const closeActiveCall = useCallStore((s) => s.closeActiveCall);
  const clearIncoming = useCallStore((s) => s.clearIncoming);

  const { data: admins = [] } = useQuery({
    queryKey: ["admins"],
    queryFn: async (): Promise<AdminPublic[]> => {
      const res = await fetch("/api/admins");
      if (!res.ok) {
        throw new Error("Failed to load admins");
      }
      return (await res.json()) as AdminPublic[];
    },
    enabled: Boolean(selfId),
    staleTime: 60_000,
  });

  const peerMap = useMemo(() => new Map(admins.map((admin) => [admin.id, admin])), [admins]);

  useEffect(() => {
    if (!selfId || !getPusherClient()) {
      return;
    }

    const subscriptions: Array<() => void> = [];

    for (const peer of admins) {
      if (peer.id === selfId) {
        continue;
      }

      const conversationId = getConversationId(selfId, peer.id);
      const channel = acquireDmChannel(conversationId);
      if (!channel) {
        continue;
      }

      const onInvite = (payload: CallInvitePayload) => {
        const state = useCallStore.getState();
        if (payload.fromId === selfId || state.activeCall) {
          return;
        }

        const caller = peerMap.get(payload.fromId) ?? peer;
        setIncoming({
          peer: caller,
          type: payload.type,
          fromName: payload.fromName,
          conversationId,
        });
      };

      const onCancel = (payload: { fromId?: string }) => {
        if (payload.fromId === selfId) {
          return;
        }
        const state = useCallStore.getState();
        if (state.incoming?.peer.id === peer.id) {
          clearIncoming();
        }
      };

      const onDecline = (payload: { fromId?: string }) => {
        if (payload.fromId === selfId) {
          return;
        }
        const state = useCallStore.getState();
        if (state.incoming?.peer.id === peer.id) {
          clearIncoming();
        }
        if (state.activeCall?.peer.id === peer.id) {
          useCallStore.setState({ activeCall: null });
          toast.error("Call declined");
        }
      };

      channel.bind(DM_CALL_EVENTS.INVITE, onInvite);
      channel.bind(DM_CALL_EVENTS.END, onCancel);
      channel.bind(DM_CALL_EVENTS.DECLINE, onDecline);

      subscriptions.push(() => {
        channel.unbind(DM_CALL_EVENTS.INVITE, onInvite);
        channel.unbind(DM_CALL_EVENTS.END, onCancel);
        channel.unbind(DM_CALL_EVENTS.DECLINE, onDecline);
        releaseDmChannel(conversationId);
      });
    }

    return () => {
      subscriptions.forEach((cleanup) => cleanup());
    };
  }, [admins, clearIncoming, peerMap, selfId, setIncoming]);

  useEffect(() => {
    if (!incoming) {
      return;
    }
    const timer = window.setTimeout(() => clearIncoming(), 45000);
    return () => window.clearTimeout(timer);
  }, [clearIncoming, incoming]);

  if (!selfId) {
    return null;
  }

  return (
    <>
      {incoming && !activeCall ? (
        <IncomingCallIsland
          callerName={incoming.fromName || incoming.peer.name}
          callerEmail={incoming.peer.email}
          callerAvatar={incoming.peer.avatar}
          callType={incoming.type}
          onAccept={acceptIncoming}
          onDecline={() => void declineIncoming()}
        />
      ) : null}

      {activeCall ? (
        <LiveKitCall
          room={activeCall.conversationId}
          callType={activeCall.type}
          peerName={activeCall.peer.name}
          onClose={() => void closeActiveCall()}
        />
      ) : null}
    </>
  );
}
