"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Share2, Video, VideoOff, Volume2 } from "lucide-react";
import { toast } from "sonner";
import type { CallPhase, CallType } from "@/lib/webrtc/call-events";
import type { CallParticipantPublic } from "@/lib/calls/types";
import { AdminAvatar } from "@/components/ui/AdminAvatar";
import { CallAvatarPulse, CallStatusText } from "@/components/dm/call-ui";
import { cn } from "@/lib/utils/cn";

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type RemotePeer = CallParticipantPublic & { stream: MediaStream | null; isMuted: boolean };

export function GroupCallOverlay({
  open,
  phase,
  callType,
  shareUrl,
  participantCount,
  participants,
  remotePeers,
  focusedPeer,
  focusedParticipantId,
  setFocusedParticipantId,
  localStream,
  isMuted,
  isCameraOff,
  self,
  peerLabel,
  onEndCall,
  onToggleMute,
  onToggleCamera,
}: {
  open: boolean;
  phase: CallPhase;
  callType: CallType;
  shareUrl: string | null;
  participantCount: number;
  participants: CallParticipantPublic[];
  remotePeers: RemotePeer[];
  focusedPeer: RemotePeer | null;
  focusedParticipantId: string | null;
  setFocusedParticipantId: (id: string) => void;
  localStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  self: CallParticipantPublic;
  peerLabel?: string;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const thumbRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [elapsed, setElapsed] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  const isVideo = callType === "video";
  const isGroup = participantCount > 2;
  const isWaiting = phase === "outgoing" || phase === "connecting";
  const isActive = phase === "active";
  const mainStream = focusedPeer?.stream ?? remotePeers.find((p) => p.stream)?.stream ?? null;
  const displayName = focusedPeer?.name ?? peerLabel ?? "Call";

  useEffect(() => {
    const el = localVideoRef.current;
    if (el) {
      el.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const el = mainVideoRef.current;
    if (el) {
      el.srcObject = mainStream;
    }
  }, [mainStream]);

  useEffect(() => {
    remotePeers.forEach((peer) => {
      const el = thumbRefs.current.get(peer.id);
      if (el) {
        el.srcObject = peer.stream;
      }
    });
  }, [remotePeers]);

  useEffect(() => {
    if (phase === "outgoing" && shareUrl) {
      setShareOpen(true);
    }
  }, [phase, shareUrl]);

  useEffect(() => {
    if (!open || !isActive) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [open, isActive]);

  const copyShareLink = useCallback(async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Call link copied — share with other admins");
    } catch {
      toast.error("Could not copy link");
    }
  }, [shareUrl]);

  if (!open || !callType) {
    return null;
  }

  const centerStatus =
    phase === "active" ? (
      <span className="font-mono-ui tabular-nums">
        {formatClock(elapsed)} · {participantCount} {participantCount === 1 ? "person" : "people"}
      </span>
    ) : phase === "outgoing" ? (
      <CallStatusText phase="outgoing" />
    ) : (
      <CallStatusText phase="connecting" />
    );

  const footerMeta = isActive ? (
    <span className="text-white/70">
      {formatTimeLabel()} · {participantCount} in call · {formatClock(elapsed)}
    </span>
  ) : null;

  const sharePanel = shareOpen && shareUrl ? (
    <div className="absolute left-4 right-4 top-16 z-30 rounded-xl border border-white/15 bg-navy-900/95 p-4 shadow-2xl backdrop-blur-md sm:left-auto sm:right-6 sm:max-w-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">Share call link</p>
      <p className="mt-1 text-sm text-white/70">Copy this link and send it to any admin. They can join after signing in.</p>
      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={shareUrl}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"
          aria-label="Call share link"
        />
        <button
          type="button"
          onClick={() => void copyShareLink()}
          className="shrink-0 rounded-lg bg-gold-600 px-3 py-2 text-xs font-semibold text-navy-950 hover:bg-gold-500"
        >
          Copy
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-navy-950 text-white" role="dialog" aria-modal="true">
      {/* Top actions */}
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => setShareOpen((o) => !o)}
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium backdrop-blur-md transition",
            shareOpen ? "bg-gold-600 text-navy-950" : "bg-navy-800/60 text-white hover:bg-navy-700/70",
          )}
          aria-expanded={shareOpen}
        >
          <Share2 className="h-4 w-4" />
          Share link
        </button>
        {isVideo ? (
          <span className="rounded-full bg-navy-800/60 px-3 py-1 text-xs font-medium backdrop-blur-md">Video</span>
        ) : (
          <span className="rounded-full bg-navy-800/60 px-3 py-1 text-xs font-medium backdrop-blur-md">Voice</span>
        )}
      </div>
      {sharePanel}

      <div className={cn("relative flex min-h-0 flex-1", isGroup ? "flex-row" : "flex-col")}>
        {/* Main stage */}
        <div className={cn("relative flex min-h-0 flex-1 items-center justify-center overflow-hidden", isGroup && "pr-0")}>
          {isVideo ? (
            <>
              <video
                ref={mainVideoRef}
                autoPlay
                playsInline
                className={cn("absolute inset-0 h-full w-full object-cover", mainStream ? "opacity-100" : "opacity-0")}
              />
              {!mainStream ? (
                <div className="relative z-10 flex flex-col items-center px-6 text-center">
                  {isWaiting ? (
                    <CallAvatarPulse>
                      <AdminAvatar
                        name={displayName}
                        email={focusedPeer?.email}
                        image={focusedPeer?.avatar ?? null}
                        size="2xl"
                        className="relative z-10 h-36 w-36 text-4xl ring-4 ring-gold-400/50"
                      />
                    </CallAvatarPulse>
                  ) : (
                    <AdminAvatar
                      name={displayName}
                      email={focusedPeer?.email}
                      image={focusedPeer?.avatar ?? null}
                      size="2xl"
                      className="h-36 w-36 text-4xl ring-4 ring-gold-400/40"
                    />
                  )}
                  <h2 className="mt-6 text-xl font-bold">{displayName}</h2>
                  <p className="mt-2 text-sm text-white/60">{centerStatus}</p>
                </div>
              ) : (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/60 to-transparent" />
              )}

              {!isGroup ? (
                <div className="absolute bottom-24 right-4 z-20 h-[7.5rem] w-[5.25rem] overflow-hidden rounded-xl border-2 border-white/20 bg-navy-900 shadow-2xl sm:h-[8.5rem] sm:w-24">
                  {isCameraOff ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1 bg-navy-800 text-white/60">
                      <VideoOff className="h-6 w-6" />
                      <span className="text-[9px]">You</span>
                    </div>
                  ) : (
                    <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="call-screen-bg-audio absolute inset-0 flex flex-col items-center justify-center px-6">
              {isWaiting ? (
                <CallAvatarPulse>
                  <AdminAvatar
                    name={displayName}
                    email={focusedPeer?.email}
                    image={focusedPeer?.avatar ?? null}
                    size="2xl"
                    className="relative z-10 h-44 w-44 text-5xl ring-4 ring-gold-400/50"
                  />
                </CallAvatarPulse>
              ) : (
                <AdminAvatar
                  name={displayName}
                  email={focusedPeer?.email}
                  image={focusedPeer?.avatar ?? null}
                  size="2xl"
                  className="h-44 w-44 text-5xl ring-4 ring-gold-400/40"
                />
              )}
              <h2 className="mt-8 text-2xl font-bold">{displayName}</h2>
              <p className="mt-2 text-sm text-white/60">{centerStatus}</p>
            </div>
          )}
        </div>

        {/* Group sidebar */}
        {isGroup && isVideo ? (
          <aside className="call-participant-rail relative z-20 flex w-[7.5rem] shrink-0 flex-col gap-2 overflow-y-auto border-l border-gold-500/15 bg-navy-900/75 p-2 backdrop-blur-md sm:w-[8.5rem]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-gold-500/60 bg-navy-900">
              {isCameraOff ? (
                <div className="flex h-full flex-col items-center justify-center text-white/50">
                  <VideoOff className="h-5 w-5" />
                  <span className="mt-1 text-[9px]">You</span>
                </div>
              ) : (
                <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              )}
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px]">You</span>
            </div>
            {remotePeers.map((peer) => {
              const active = peer.id === focusedParticipantId;
              return (
                <button
                  key={peer.id}
                  type="button"
                  onClick={() => setFocusedParticipantId(peer.id)}
                  className={cn(
                    "relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 bg-navy-900 text-left transition",
                    active ? "border-gold-400 ring-2 ring-gold-400/40" : "border-white/15 hover:border-white/35",
                  )}
                >
                  {peer.stream ? (
                    <video
                      ref={(el) => {
                        if (el) {
                          thumbRefs.current.set(peer.id, el);
                          el.srcObject = peer.stream;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <AdminAvatar name={peer.name} email={peer.email} image={peer.avatar} size="lg" className="h-12 w-12" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-black/60 px-1 text-[9px]">
                    {peer.name.split(" ")[0]}
                  </span>
                  <span
                    className={cn(
                      "absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full",
                      peer.isMuted ? "bg-red-500" : "bg-emerald-500",
                    )}
                    aria-hidden
                  >
                    {peer.isMuted ? <MicOff className="h-2.5 w-2.5" /> : <Mic className="h-2.5 w-2.5" />}
                  </span>
                </button>
              );
            })}
          </aside>
        ) : null}
      </div>

      <footer className="call-controls-dock relative z-30 shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 sm:gap-4">
          {footerMeta ? (
            <p className="absolute left-4 top-4 hidden truncate text-xs text-white/60 sm:block sm:max-w-[40%]">
              {footerMeta}
            </p>
          ) : null}

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onToggleMute}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition",
                isMuted ? "bg-gold-500 text-navy-950" : "bg-navy-700/80 text-white hover:bg-navy-600/90",
              )}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            {isVideo ? (
              <button
                type="button"
                onClick={onToggleCamera}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition",
                  isCameraOff ? "bg-gold-500 text-navy-950" : "bg-navy-700/80 text-white hover:bg-navy-600/90",
                )}
                aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
              >
                {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>
            ) : (
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-700/80 text-white hover:bg-navy-600/90"
                aria-label="Speaker"
                title="Speaker"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onEndCall}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg hover:bg-red-600 sm:h-14 sm:w-14 sm:rounded-2xl"
              aria-label="End call"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </div>

        </div>
      </footer>
    </div>
  );
}
