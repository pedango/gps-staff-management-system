"use client";

import type { FileType, Message } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EmojiClickData } from "emoji-picker-react";
import { toast } from "sonner";
import { isSameDay } from "date-fns";
import { formatDateTime, formatMessageDayLabel, formatMessageTime } from "@/lib/utils/format";
import { usePusherDmSubscription } from "@/hooks/usePusher";
import type { AdminPublic } from "@/types/admin";
import { AdminAvatar } from "@/components/ui/AdminAvatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DmCallButtons } from "@/components/dm/DmCallButtons";
import { DmComposeBar } from "@/components/dm/DmComposeBar";
import { GroupCallOverlay } from "@/components/dm/GroupCallOverlay";
import { IncomingCallModal } from "@/components/dm/IncomingCallModal";
import { WavePlayer } from "@/components/dm/WavePlayer";
import { useCallSession } from "@/hooks/useCallSession";
import { TYPE_CAPTION, TYPE_MONO } from "@/lib/typography";
import { cn } from "@/lib/utils/cn";

type AdminMini = { id: string; name: string; email: string; avatar: string | null };

export type MessageRow = Message & {
  sender: AdminMini;
  receiver: AdminMini;
  pending?: boolean;
};

async function uploadFile(file: File): Promise<{ url: string; fileType: "PDF" | "IMAGE" | "VOICE"; fileName: string; size: number }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Upload failed");
  }
  return (await res.json()) as { url: string; fileType: "PDF" | "IMAGE" | "VOICE"; fileName: string; size: number };
}

export function DmThreadClient({
  selfId,
  selfName,
  selfEmail,
  selfAvatar,
  peer,
  conversationId,
}: {
  selfId: string;
  selfName: string;
  selfEmail: string;
  selfAvatar: string | null;
  peer: AdminPublic;
  conversationId: string;
}) {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const call = useCallSession({
    conversationId,
    selfId,
    selfName,
    selfEmail,
    selfAvatar,
    peerId: peer.id,
  });

  const onStartCall = useCallback(
    (type: "audio" | "video") => {
      if (!call.pusherReady) {
        toast.error("Calls need live messaging. Configure Pusher in your environment.");
        return;
      }
      void call.startCall(type).catch((e) => {
        toast.error(e instanceof Error ? e.message : "Could not start call");
      });
    },
    [call],
  );

  const queryKey = useMemo(() => ["messages", conversationId] as const, [conversationId]);

  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: async (): Promise<MessageRow[]> => {
      const res = await fetch(`/api/messages/${encodeURIComponent(conversationId)}`);
      if (!res.ok) {
        throw new Error("Failed to load messages");
      }
      return (await res.json()) as MessageRow[];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.length]);

  usePusherDmSubscription<{ message: MessageRow }>(conversationId, (payload) => {
    queryClient.setQueryData<MessageRow[]>(queryKey, (prev) => {
      const list = prev ?? [];
      if (list.some((m) => m.id === payload.message.id)) {
        return list;
      }
      return [...list, { ...payload.message, pending: false }];
    });
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  });

  const sendMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: unknown };
        throw new Error(typeof errBody.error === "string" ? errBody.error : "Failed to send");
      }
      return (await res.json()) as MessageRow;
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MessageRow[]>(queryKey);
      const optimistic: MessageRow = {
        id: `pending-${Date.now()}`,
        senderId: selfId,
        receiverId: peer.id,
        text: typeof body.text === "string" ? body.text : null,
        fileUrl: typeof body.fileUrl === "string" ? body.fileUrl : null,
        fileType: (body.fileType as FileType | null) ?? null,
        fileName: typeof body.fileName === "string" ? body.fileName : null,
        voiceUrl: typeof body.voiceUrl === "string" ? body.voiceUrl : null,
        voiceDuration: typeof body.voiceDuration === "number" ? body.voiceDuration : null,
        readAt: null,
        createdAt: new Date(),
        sender: { id: selfId, name: "You", email: "", avatar: null },
        receiver: { id: peer.id, name: peer.name, email: peer.email, avatar: peer.avatar },
        pending: true,
      };
      queryClient.setQueryData<MessageRow[]>(queryKey, (prev) => [...(prev ?? []), optimistic]);
      return { previous };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error("Message could not be sent");
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<MessageRow[]>(queryKey, (prev) => {
        const base = (prev ?? []).filter((m) => !m.pending && m.id !== saved.id);
        return [...base, saved];
      });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const onSendText = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    sendMutation.mutate({ receiverId: peer.id, text: trimmed });
    setText("");
  }, [peer.id, sendMutation, text]);

  const onEmoji = useCallback(
    (emoji: EmojiClickData) => {
      const el = textareaRef.current;
      if (!el) {
        setText((t) => `${t}${emoji.emoji}`);
        return;
      }
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const next = `${el.value.slice(0, start)}${emoji.emoji}${el.value.slice(end)}`;
      setText(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + emoji.emoji.length;
        el.setSelectionRange(pos, pos);
      });
      setEmojiOpen(false);
    },
    [setText],
  );

  const onAttach = useCallback(
    async (file: File) => {
      try {
        const uploaded = await uploadFile(file);
        if (uploaded.fileType === "VOICE") {
          sendMutation.mutate({
            receiverId: peer.id,
            voiceUrl: uploaded.url,
            voiceDuration: 1,
          });
          return;
        }
        sendMutation.mutate({
          receiverId: peer.id,
          fileUrl: uploaded.url,
          fileType: uploaded.fileType === "PDF" ? "PDF" : "IMAGE",
          fileName: uploaded.fileName,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    },
    [peer.id, sendMutation],
  );

  const onVoiceBlob = useCallback(
    async (blob: Blob, durationSec: number) => {
      try {
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        const uploaded = await uploadFile(file);
        sendMutation.mutate({
          receiverId: peer.id,
          voiceUrl: uploaded.url,
          voiceDuration: Math.max(1, Math.round(durationSec)),
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Voice upload failed");
      }
    },
    [peer.id, sendMutation],
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-navy-100 bg-white px-4">
        <Link
          href="/dm"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-navy-600 hover:bg-navy-50 md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <AdminAvatar name={peer.name} email={peer.email} image={peer.avatar} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-navy-900">{peer.name}</div>
          <div className="truncate text-xs text-navy-500" title={peer.email}>
            {peer.email}
          </div>
        </div>
        <DmCallButtons
          disabled={!call.pusherReady || call.phase !== "idle"}
          onAudioCall={() => onStartCall("audio")}
          onVideoCall={() => onStartCall("video")}
        />
      </header>

      <div
        className="flex flex-1 flex-col gap-1.5 overflow-y-auto bg-navy-50 px-2 py-2 sm:px-3"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex w-full ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton className={`h-14 rounded-2xl bg-navy-100 ${i % 2 === 0 ? "w-[55%]" : "w-[58%]"}`} />
              </div>
            ))}
          </div>
        ) : null}
        {isError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-red-600">Unable to load messages.</p>
            <Button
              type="button"
              className="rounded-xl border border-navy-200 bg-white px-4 py-2 text-sm text-navy-800 hover:bg-navy-50"
              disabled={isRefetching}
              onClick={() => void refetch()}
            >
              {isRefetching ? "Retrying…" : "Try again"}
            </Button>
          </div>
        ) : null}
        {!isPending && data && data.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-bold text-navy-500">No messages yet</p>
            <p className="mt-1 max-w-sm text-sm text-navy-400">Send the first message to start this conversation.</p>
          </div>
        ) : null}
        {data?.map((m, i) => {
          const prev = i > 0 ? data[i - 1] : null;
          const showDay =
            !prev || !isSameDay(new Date(prev.createdAt as Date | string), new Date(m.createdAt as Date | string));
          return (
            <Fragment key={m.id}>
              {showDay ? (
                <div className="flex justify-center py-3" role="presentation">
                  <span className="rounded-xl bg-navy-100/90 px-3 py-1 text-xs font-semibold text-navy-600">
                    {formatMessageDayLabel(m.createdAt)}
                  </span>
                </div>
              ) : null}
              <MessageBubble message={m} selfId={selfId} onImageClick={setLightbox} />
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <DmComposeBar
        text={text}
        setText={setText}
        textareaRef={textareaRef}
        emojiOpen={emojiOpen}
        setEmojiOpen={setEmojiOpen}
        onEmoji={onEmoji}
        onAttach={(f) => void onAttach(f)}
        onSendText={onSendText}
        onVoiceBlob={onVoiceBlob}
        sendDisabled={sendMutation.isPending}
      />

      <IncomingCallModal
        open={call.phase === "incoming"}
        callerName={call.incomingFromName ?? peer.name}
        callerEmail={peer.email}
        callerAvatar={peer.avatar}
        callType={call.callType ?? "audio"}
        onAccept={() => {
          void call.acceptCall().catch((e) => {
            toast.error(e instanceof Error ? e.message : "Could not join call");
          });
        }}
        onDecline={() => void call.declineCall()}
      />

      <GroupCallOverlay
        open={call.inCallUi}
        phase={call.phase}
        callType={call.callType ?? "audio"}
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
        peerLabel={peer.name}
        onEndCall={() => void call.endCall()}
        onToggleMute={call.toggleMute}
        onToggleCamera={call.toggleCamera}
      />

      <Dialog open={Boolean(lightbox)} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
          {lightbox ? (
            <div className="relative h-[70vh] w-full">
              <Image src={lightbox} alt="" fill className="object-contain" unoptimized />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageBubble({
  message,
  selfId,
  onImageClick,
}: {
  message: MessageRow;
  selfId: string;
  onImageClick: (url: string) => void;
}) {
  const mine = message.senderId === selfId;
  const sender = message.sender;
  return (
    <div className={`flex w-full items-end gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine ? (
        <AdminAvatar name={sender.name} email={sender.email} image={sender.avatar} size="sm" className="mb-0.5" />
      ) : null}
      <div
        className={`max-w-[65%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          mine
            ? "rounded-2xl rounded-br-sm bg-navy-900 text-white"
            : "rounded-2xl rounded-bl-sm border border-navy-100 bg-navy-100 text-navy-900"
        } ${message.pending ? "opacity-80 ring-2 ring-gold-400/50" : ""}`}
      >
        {message.text ? <p className="whitespace-pre-wrap pr-1">{message.text}</p> : null}
        {message.fileUrl && message.fileType === "IMAGE" ? (
          <button
            type="button"
            className="relative mt-1.5 block aspect-[4/3] w-full max-w-[200px] overflow-hidden rounded-md"
            onClick={() => onImageClick(message.fileUrl!)}
          >
            <Image src={message.fileUrl} alt="" fill className="object-cover" unoptimized />
          </button>
        ) : null}
        {message.fileUrl && message.fileType === "PDF" ? (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noreferrer"
            className={`mt-1.5 flex items-center gap-2 rounded-md px-2.5 py-2 text-sm ${
              mine ? "bg-white/10 text-white hover:bg-white/15" : "bg-navy-50 text-navy-900 hover:bg-navy-100"
            }`}
          >
            <span className="font-semibold">PDF</span>
            <span className="truncate">{message.fileName ?? "document.pdf"}</span>
          </a>
        ) : null}
        {message.voiceUrl ? (
          <div className="mt-1.5">
            <WavePlayer src={message.voiceUrl} accentClass={mine ? "text-gold-300" : "text-navy-800"} />
            {message.voiceDuration ? (
              <div className={cn(TYPE_CAPTION, "mt-0.5", mine ? "text-navy-200" : "text-navy-500")}>{message.voiceDuration}s</div>
            ) : null}
          </div>
        ) : null}
        <div className={cn(TYPE_MONO, "mt-0.5 flex justify-end gap-1 leading-none", mine ? "text-navy-200" : "text-navy-400")}>
          <time dateTime={typeof message.createdAt === "string" ? message.createdAt : message.createdAt.toISOString()} title={formatDateTime(message.createdAt)}>
            {formatMessageTime(message.createdAt)}
          </time>
        </div>
      </div>
      {mine ? <div className="mb-0.5 w-8 shrink-0" aria-hidden /> : null}
    </div>
  );
}
