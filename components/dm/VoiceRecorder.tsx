"use client";

import { Mic } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function VoiceRecorder({
  disabled,
  onRecorded,
  inline = false,
  className,
}: {
  disabled?: boolean;
  onRecorded: (blob: Blob, durationSec: number) => void | Promise<void>;
  inline?: boolean;
  className?: string;
}) {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const stop = useCallback(async () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const recorder = mediaRef.current;
    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      return;
    }
    const duration = Math.max(0.1, (Date.now() - startRef.current) / 1000);
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    recorder.stream.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];
    mediaRef.current = null;
    setRecording(false);
    setSeconds(0);
    if (blob.size > 0) {
      await onRecorded(blob, duration);
    }
  }, [onRecorded]);

  const start = useCallback(async () => {
    if (disabled) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    recorder.start(250);
    mediaRef.current = recorder;
    startRef.current = Date.now();
    setRecording(true);
    setSeconds(0);
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, [disabled]);

  const btnClass = inline
    ? cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-navy-600 transition-colors hover:bg-navy-100",
        recording && "bg-red-100 text-red-600",
        className,
      )
    : cn(
        `h-10 w-10 rounded-full p-0 ${recording ? "bg-red-600 text-white hover:bg-red-700" : "bg-transparent text-navy-600 hover:bg-black/[0.05]"}`,
        className,
      );

  if (inline) {
    return (
      <button
        type="button"
        className={btnClass}
        disabled={disabled}
        onPointerDown={(e) => {
          e.preventDefault();
          void start();
        }}
        onPointerUp={() => void stop()}
        onPointerLeave={() => {
          if (recording) void stop();
        }}
        aria-label="Hold to record voice message"
      >
        <Mic className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={btnClass}
        disabled={disabled}
        onPointerDown={(e) => {
          e.preventDefault();
          void start();
        }}
        onPointerUp={() => void stop()}
        onPointerLeave={() => {
          if (recording) void stop();
        }}
        aria-label="Hold to record voice message"
      >
        <Mic className="h-5 w-5" />
      </button>
      {recording ? <span className="text-xs font-mono-ui text-red-600">{seconds}s</span> : null}
    </div>
  );
}
