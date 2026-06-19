"use client";

import "@livekit/components-styles";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { Loader2, X } from "lucide-react";

type TokenResponse = { token: string; url: string };

export function LiveKitCall({
  room,
  callType,
  peerName,
  onClose,
}: {
  room: string;
  callType: "audio" | "video";
  peerName: string;
  onClose: () => void;
}) {
  const [conn, setConn] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ room }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Could not connect to call");
        }
        const data = (await res.json()) as TokenResponse;
        if (active) {
          setConn(data);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Could not connect to call");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [room]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-navy-950" data-lk-theme="default">
      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{peerName}</p>
          <p className="text-xs text-white/60">{callType === "video" ? "Video call" : "Voice call"}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close call"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
            >
              Close
            </button>
          </div>
        ) : !conn ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/80">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p className="text-sm">Connecting…</p>
          </div>
        ) : (
          <LiveKitRoom
            serverUrl={conn.url}
            token={conn.token}
            connect
            audio
            video={callType === "video"}
            onDisconnected={onClose}
            style={{ height: "100%" }}
          >
            <VideoConference />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}
