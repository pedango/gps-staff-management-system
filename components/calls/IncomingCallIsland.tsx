"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import type { CallType } from "@/lib/webrtc/call-events";
import { AdminAvatar } from "@/components/ui/AdminAvatar";
import { cn } from "@/lib/utils/cn";

export function IncomingCallIsland({
  callerName,
  callerEmail,
  callerAvatar,
  callType,
  onAccept,
  onDecline,
}: {
  callerName: string;
  callerEmail: string;
  callerAvatar: string | null;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const isVideo = callType === "video";

  return (
    <div
      className={cn(
        "incoming-call-island pointer-events-auto fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[200] flex w-[min(92vw,420px)] -translate-x-1/2 items-center gap-3 rounded-full bg-black px-3 py-2 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        "animate-in slide-in-from-top-4 fade-in duration-300",
      )}
      role="status"
      aria-live="assertive"
      aria-label={isVideo ? "Incoming video call" : "Incoming voice call"}
    >
      <AdminAvatar
        name={callerName}
        email={callerEmail}
        image={callerAvatar}
        size="sm"
        className="h-10 w-10 shrink-0 ring-2 ring-white/10"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/55">
          {isVideo ? "Incoming video" : "Incoming call"}
        </p>
        <p className="truncate text-sm font-semibold leading-tight text-white">{callerName}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2 pr-1">
        <button
          type="button"
          onClick={onDecline}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-105 active:scale-95"
          aria-label="Decline call"
        >
          <PhoneOff className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white transition-transform hover:scale-105 active:scale-95"
          aria-label="Accept call"
        >
          {isVideo ? <Video className="h-4 w-4" aria-hidden /> : <Phone className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
