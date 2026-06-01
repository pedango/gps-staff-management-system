import type { RoomCallEventName } from "@/lib/webrtc/call-events";

export async function emitRoomSignal(
  sessionId: string,
  event: RoomCallEventName,
  data: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`/api/calls/sessions/${encodeURIComponent(sessionId)}/signal`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event, data }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Call signaling failed");
  }
}
