"use client";

import Link from "next/link";
import { MessageSquare, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function AdminPeerActions({
  messageHref,
  disabled,
  onAudioCall,
  onVideoCall,
}: {
  messageHref: string;
  disabled?: boolean;
  onAudioCall: () => void;
  onVideoCall: () => void;
}) {
  const actionClass =
    "flex h-10 w-10 items-center justify-center rounded-full border border-navy-100 text-navy-600 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onAudioCall}
        className={cn(actionClass, "text-navy-700")}
        aria-label="Audio call"
        title={disabled ? "Calls require live messaging (Pusher)" : "Audio call"}
      >
        <Phone className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onVideoCall}
        className={cn(actionClass, "text-navy-700")}
        aria-label="Video call"
        title={disabled ? "Calls require live messaging (Pusher)" : "Video call"}
      >
        <Video className="h-4 w-4" aria-hidden />
      </button>
      <Link
        href={messageHref}
        className={cn(actionClass, "text-gold-700 hover:bg-gold-50")}
        aria-label="Send message"
        title="Send message"
      >
        <MessageSquare className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
