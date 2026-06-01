"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import type { CallType } from "@/lib/webrtc/call-events";
import { AdminAvatar } from "@/components/ui/AdminAvatar";
import { CallAvatarPulse, CallControlButton } from "@/components/dm/call-ui";

export function IncomingCallModal({
  open,
  callerName,
  callerEmail,
  callerAvatar,
  callType,
  onAccept,
  onDecline,
}: {
  open: boolean;
  callerName: string;
  callerEmail: string;
  callerAvatar: string | null;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}) {
  if (!open) {
    return null;
  }

  const isVideo = callType === "video";
  const callTypeLabel = isVideo ? "Incoming video call" : "Incoming voice call";

  return (
    <div
      className="call-screen-bg-audio fixed inset-0 z-[80] flex flex-col text-white"
      role="dialog"
      aria-modal="true"
      aria-label={callTypeLabel}
    >
      <header className="flex shrink-0 flex-col items-center gap-1 px-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-center">
        <span className="rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
          {callTypeLabel}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        <CallAvatarPulse>
          <AdminAvatar
            name={callerName}
            email={callerEmail}
            image={callerAvatar}
            size="2xl"
            className="relative z-10 h-40 w-40 text-5xl ring-4 ring-gold-400/50 sm:h-44 sm:w-44"
          />
        </CallAvatarPulse>
        <h2 className="mt-8 max-w-full truncate text-2xl font-bold tracking-tight">{callerName}</h2>
        {callerEmail ? (
          <p className="mt-1 max-w-xs truncate text-sm text-white/50" title={callerEmail}>
            {callerEmail}
          </p>
        ) : null}
        <p className="mt-3 text-sm font-medium text-white/70">Tap accept to answer</p>
        <p className="mt-2 text-xs text-white/45">Other admins can join via the call link shared by the caller.</p>
      </div>

      <footer className="call-controls-dock shrink-0 px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
        <div className="mx-auto flex max-w-sm items-end justify-center gap-14 sm:gap-20">
          <CallControlButton label="Decline" onClick={onDecline} variant="danger">
            <PhoneOff className="h-6 w-6" />
          </CallControlButton>
          <CallControlButton label="Accept" onClick={onAccept} variant="success">
            {isVideo ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
          </CallControlButton>
        </div>
      </footer>
    </div>
  );
}
