"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import type { CallPhase, CallType } from "@/lib/webrtc/call-events";
import { AdminAvatar } from "@/components/ui/AdminAvatar";
import {
  CallAvatarPulse,
  CallControlButton,
  CallStatusText,
  CallTopBar,
} from "@/components/dm/call-ui";
import { cn } from "@/lib/utils/cn";

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function DmCallOverlay({
  open,
  phase,
  callType,
  peerName,
  peerEmail,
  peerAvatar,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  onEndCall,
  onToggleMute,
  onToggleCamera,
}: {
  open: boolean;
  phase: CallPhase;
  callType: CallType;
  peerName: string;
  peerEmail: string;
  peerAvatar: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const el = localVideoRef.current;
    if (!el) {
      return;
    }
    el.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) {
      return;
    }
    el.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (!open || phase !== "active") {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, phase]);

  if (!open || !callType) {
    return null;
  }

  const isVideo = callType === "video";
  const isActive = phase === "active";
  const isWaiting = phase === "outgoing" || phase === "connecting";
  const duration = isActive ? formatDuration(elapsed) : undefined;

  const statusNode =
    phase === "active" ? (
      <CallStatusText phase="active" duration={duration} />
    ) : phase === "outgoing" ? (
      <CallStatusText phase="outgoing" />
    ) : phase === "connecting" ? (
      <CallStatusText phase="connecting" />
    ) : null;

  const callTypeLabel = isVideo ? "Video call" : "Voice call";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex flex-col text-white",
        isVideo && remoteStream ? "bg-black" : isVideo ? "call-screen-bg-video-waiting" : "call-screen-bg-audio",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`${callTypeLabel} with ${peerName}`}
    >
      <CallTopBar callTypeLabel={callTypeLabel} peerName={peerName} status={statusNode} />

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6">
        {isVideo ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={cn(
                "absolute inset-0 h-full w-full object-cover",
                remoteStream ? "opacity-100" : "opacity-0",
              )}
            />
            {!remoteStream ? (
              <div className="relative z-10 flex flex-col items-center">
                {isWaiting ? (
                  <CallAvatarPulse>
                    <AdminAvatar
                      name={peerName}
                      email={peerEmail}
                      image={peerAvatar}
                      size="2xl"
                      className="relative z-10 h-36 w-36 text-4xl ring-4 ring-gold-400/50"
                    />
                  </CallAvatarPulse>
                ) : (
                  <AdminAvatar
                    name={peerName}
                    email={peerEmail}
                    image={peerAvatar}
                    size="2xl"
                    className="h-36 w-36 text-4xl ring-4 ring-gold-400/40"
                  />
                )}
              </div>
            ) : (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" aria-hidden />
            )}

            <div
              className={cn(
                "absolute bottom-28 right-4 z-20 overflow-hidden rounded-2xl border-2 border-white/25 bg-navy-900 shadow-2xl sm:bottom-32 sm:right-6",
                "h-[9.5rem] w-[6.75rem] sm:h-[11rem] sm:w-[8rem]",
              )}
            >
              {isCameraOff ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-navy-800 text-white/70">
                  <VideoOff className="h-8 w-8" />
                  <span className="text-[10px] font-medium">Camera off</span>
                </div>
              ) : (
                <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              )}
            </div>
          </>
        ) : (
          <div className="relative z-10 flex flex-col items-center text-center">
            {isWaiting ? (
              <CallAvatarPulse>
                <AdminAvatar
                  name={peerName}
                  email={peerEmail}
                  image={peerAvatar}
                  size="2xl"
                  className="relative z-10 h-40 w-40 text-5xl ring-4 ring-gold-400/50 sm:h-44 sm:w-44"
                />
              </CallAvatarPulse>
            ) : (
              <AdminAvatar
                name={peerName}
                email={peerEmail}
                image={peerAvatar}
                size="2xl"
                className="h-40 w-40 text-5xl ring-4 ring-gold-400/40 sm:h-44 sm:w-44"
              />
            )}
            {peerEmail ? (
              <p className="mt-4 max-w-xs truncate text-sm text-white/50" title={peerEmail}>
                {peerEmail}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <footer className="call-controls-dock relative z-20 shrink-0 px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-8">
        <div
          className={cn(
            "mx-auto flex max-w-md items-end justify-center",
            isVideo ? "gap-8 sm:gap-10" : "gap-10 sm:gap-14",
          )}
        >
          <CallControlButton label={isMuted ? "Unmute" : "Mute"} onClick={onToggleMute}>
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </CallControlButton>

          <CallControlButton label="End" onClick={onEndCall} variant="danger">
            <PhoneOff className="h-7 w-7" />
          </CallControlButton>

          {isVideo ? (
            <CallControlButton label={isCameraOff ? "Camera on" : "Camera"} onClick={onToggleCamera}>
              {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </CallControlButton>
          ) : (
            <div className="w-14" aria-hidden />
          )}
        </div>
      </footer>
    </div>
  );
}
