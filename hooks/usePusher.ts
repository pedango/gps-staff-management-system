"use client";

import { useEffect, useRef } from "react";
import { acquireDmChannel, releaseDmChannel } from "@/lib/pusher-channel";

export function usePusherDmSubscription<T>(conversationId: string, handler: (payload: T) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const channel = acquireDmChannel(conversationId);
    if (!channel) {
      return;
    }
    const listener = (payload: T) => {
      handlerRef.current(payload);
    };
    channel.bind("new-message", listener);
    return () => {
      channel.unbind("new-message", listener);
      releaseDmChannel(conversationId);
    };
  }, [conversationId]);
}
