import type { DmCallEventName } from "@/lib/webrtc/call-events";

export async function emitCallSignal(
  conversationId: string,
  event: DmCallEventName,
  data: Record<string, unknown>,
): Promise<void> {
  const res = await fetch("/api/calls/signal", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ conversationId, event, data }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Call signaling failed");
  }
}
