"use client";

import "@livekit/components-styles";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { ExternalE2EEKeyProvider, Room, type RoomOptions } from "livekit-client";
import { Loader2, ShieldCheck, X } from "lucide-react";

type TokenResponse = { token: string; url: string; e2eeKey?: string };

type Connection = {
  token: string;
  url: string;
  room: Room;
  encrypted: boolean;
};

export function LiveKitCall({
  room: roomName,
  callType,
  peerName,
  onClose,
}: {
  room: string;
  callType: "audio" | "video";
  peerName: string;
  onClose: () => void;
}) {
  const [conn, setConn] = useState<Connection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let createdRoom: Room | null = null;
    let worker: Worker | null = null;

    void (async () => {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ room: roomName }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Could not connect to call");
        }
        const data = (await res.json()) as TokenResponse;

        // Build the end-to-end encryption context if supported by the browser.
        let e2ee: RoomOptions["e2ee"] | undefined;
        if (data.e2eeKey && typeof window !== "undefined" && window.isSecureContext) {
          try {
            worker = new Worker(new URL("livekit-client/e2ee-worker", import.meta.url));
            const keyProvider = new ExternalE2EEKeyProvider();
            await keyProvider.setKey(data.e2eeKey);
            e2ee = { keyProvider, worker };
          } catch {
            e2ee = undefined;
          }
        }

        createdRoom = new Room(e2ee ? { e2ee } : {});

        let encrypted = false;
        if (e2ee) {
          try {
            await createdRoom.setE2EEEnabled(true);
            encrypted = true;
          } catch {
            encrypted = false;
          }
        }

        if (!active) {
          await createdRoom.disconnect();
          worker?.terminate();
          return;
        }
        setConn({ token: data.token, url: data.url, room: createdRoom, encrypted });
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Could not connect to call");
        }
      }
    })();

    return () => {
      active = false;
      void createdRoom?.disconnect();
      worker?.terminate();
    };
  }, [roomName]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-navy-950" data-lk-theme="default">
      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{peerName}</p>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <span>{callType === "video" ? "Video call" : "Voice call"}</span>
            {conn?.encrypted ? (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                End-to-end encrypted
              </span>
            ) : null}
          </div>
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
            room={conn.room}
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
