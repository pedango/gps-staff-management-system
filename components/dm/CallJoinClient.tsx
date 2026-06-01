"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Video } from "lucide-react";
import { toast } from "sonner";
import type { CallType } from "@/lib/webrtc/call-events";
import { GroupCallOverlay } from "@/components/dm/GroupCallOverlay";
import { useCallSession } from "@/hooks/useCallSession";
import type { CallSessionPublic } from "@/lib/calls/types";

export function CallJoinClient({
  session,
  selfId,
  selfName,
  selfEmail,
  selfAvatar,
}: {
  session: CallSessionPublic;
  selfId: string;
  selfName: string;
  selfEmail: string;
  selfAvatar: string | null;
}) {
  const router = useRouter();
  const alreadyIn = session.participants.some((p) => p.id === selfId);

  const call = useCallSession({
    selfId,
    selfName,
    selfEmail,
    selfAvatar,
  });

  const { joinSession, phase } = call;

  useEffect(() => {
    if (alreadyIn && phase === "idle") {
      void joinSession(session.id, session.callType).catch((e) => {
        toast.error(e instanceof Error ? e.message : "Could not rejoin call");
        router.push("/dm");
      });
    }
  }, [alreadyIn, phase, joinSession, session.id, session.callType, router]);

  const onJoin = (type: CallType) => {
    void call.joinSession(session.id, type).catch((e) => {
      toast.error(e instanceof Error ? e.message : "Could not join call");
    });
  };

  if (call.inCallUi) {
    return (
      <GroupCallOverlay
        open={call.inCallUi}
        phase={call.phase}
        callType={call.callType ?? session.callType}
        shareUrl={call.shareUrl}
        participantCount={call.participantCount}
        participants={call.participants}
        remotePeers={call.remotePeers}
        focusedPeer={call.focusedPeer}
        focusedParticipantId={call.focusedParticipantId}
        setFocusedParticipantId={call.setFocusedParticipantId}
        localStream={call.localStream}
        isMuted={call.isMuted}
        isCameraOff={call.isCameraOff}
        self={call.self}
        onEndCall={() => {
          void call.endCall();
          router.push("/dm");
        }}
        onToggleMute={call.toggleMute}
        onToggleCamera={call.toggleCamera}
      />
    );
  }

  if (alreadyIn && (call.phase === "connecting" || call.phase === "outgoing")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-navy-700">
        <Loader2 className="h-10 w-10 animate-spin text-navy-500" />
        <p className="text-sm font-medium">Joining call…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold-700">GPS-PMS Call</p>
      <h1 className="mt-2 text-2xl font-bold text-navy-900">
        {session.callType === "video" ? "Video" : "Voice"} call in progress
      </h1>
      <p className="mt-2 text-sm text-navy-600">
        {session.participants.length} {session.participants.length === 1 ? "admin is" : "admins are"} already in this
        call. Join below — your microphone{session.callType === "video" ? " and camera" : ""} will be requested.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => onJoin(session.callType)}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-navy-900 px-6 text-sm font-semibold text-white hover:bg-navy-800"
        >
          {session.callType === "video" ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
          Join call
        </button>
        <button
          type="button"
          onClick={() => router.push("/dm")}
          className="inline-flex h-12 items-center rounded-xl border border-navy-200 px-6 text-sm font-medium text-navy-800 hover:bg-navy-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
