"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function CallStatusDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1 w-1 rounded-full bg-current opacity-80 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

export function CallStatusText({
  phase,
  duration,
}: {
  phase: "outgoing" | "connecting" | "active";
  duration?: string;
}) {
  if (phase === "active" && duration) {
    return <span className="font-mono-ui tabular-nums tracking-wide">{duration}</span>;
  }
  const label = phase === "outgoing" ? "Ringing" : "Connecting";
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <CallStatusDots />
    </span>
  );
}

export function CallTopBar({
  callTypeLabel,
  peerName,
  status,
}: {
  callTypeLabel: string;
  peerName: string;
  status: ReactNode;
}) {
  return (
    <header className="relative z-20 flex shrink-0 flex-col items-center gap-1 px-6 pb-2 pt-[max(1rem,env(safe-area-inset-top))] text-center">
      <span className="rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
        {callTypeLabel}
      </span>
      <h1 className="max-w-full truncate text-lg font-semibold text-white">{peerName}</h1>
      <p className="text-sm font-medium text-white/70">{status}</p>
    </header>
  );
}

export function CallControlButton({
  label,
  onClick,
  variant = "secondary",
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  variant?: "secondary" | "danger" | "success";
  children: ReactNode;
  className?: string;
}) {
  const btnClass =
    variant === "danger"
      ? "h-[4.25rem] w-[4.25rem] bg-red-500 text-white shadow-lg shadow-red-900/40 hover:bg-red-600"
      : variant === "success"
        ? "h-16 w-16 bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-600"
        : "h-14 w-14 bg-white/15 text-white backdrop-blur-md hover:bg-white/25";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400",
          btnClass,
        )}
      >
        {children}
      </button>
      <span className="text-xs font-medium text-white/85">{label}</span>
    </div>
  );
}

export function CallAvatarPulse({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex items-center justify-center">
      <span className="call-pulse-ring absolute inset-0 rounded-full border-2 border-gold-400/50" aria-hidden />
      <span
        className="call-pulse-ring absolute inset-0 rounded-full border border-white/20"
        style={{ animationDelay: "0.6s" }}
        aria-hidden
      />
      {children}
    </div>
  );
}
