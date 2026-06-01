import type PusherClient from "pusher-js";
import { getPusherClient } from "@/lib/pusher-client";

const refCounts = new Map<string, number>();

export function dmChannelName(conversationId: string): string {
  return `private-dm-${conversationId}`;
}

export function callChannelName(sessionId: string): string {
  return `private-call-${sessionId}`;
}

/** Subscribe with reference counting so multiple hooks can share one channel. */
export function acquireDmChannel(conversationId: string): ReturnType<PusherClient["subscribe"]> | null {
  const pusher = getPusherClient();
  if (!pusher) {
    return null;
  }
  const name = dmChannelName(conversationId);
  refCounts.set(name, (refCounts.get(name) ?? 0) + 1);
  return pusher.subscribe(name);
}

export function releaseDmChannel(conversationId: string): void {
  releaseChannel(dmChannelName(conversationId));
}

export function acquireCallChannel(sessionId: string): ReturnType<PusherClient["subscribe"]> | null {
  const pusher = getPusherClient();
  if (!pusher) {
    return null;
  }
  const name = callChannelName(sessionId);
  refCounts.set(name, (refCounts.get(name) ?? 0) + 1);
  return pusher.subscribe(name);
}

export function releaseCallChannel(sessionId: string): void {
  releaseChannel(callChannelName(sessionId));
}

function releaseChannel(name: string): void {
  const pusher = getPusherClient();
  if (!pusher) {
    return;
  }
  const next = (refCounts.get(name) ?? 1) - 1;
  if (next <= 0) {
    refCounts.delete(name);
    pusher.unsubscribe(name);
  } else {
    refCounts.set(name, next);
  }
}
