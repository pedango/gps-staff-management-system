"use client";

import { Phone, Video } from "lucide-react";

export function DmCallButtons({
  disabled,
  onAudioCall,
  onVideoCall,
}: {
  disabled?: boolean;
  onAudioCall: () => void;
  onVideoCall: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={onAudioCall}
        className="flex h-10 w-10 items-center justify-center rounded-full text-navy-600 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Voice call"
        title={disabled ? "Calls require live messaging (Pusher)" : "Voice call"}
      >
        <Phone className="h-5 w-5" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onVideoCall}
        className="flex h-10 w-10 items-center justify-center rounded-full text-navy-600 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Video call"
        title={disabled ? "Calls require live messaging (Pusher)" : "Video call"}
      >
        <Video className="h-5 w-5" />
      </button>
    </div>
  );
}
