import { cn } from "@/lib/utils/cn";

/** Pulsing status dot (e.g. network verified on login). */
export function AnimatedBadge({ className, label = "Status indicator" }: { className?: string; label?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)} role="img" aria-label={label}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" aria-hidden />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
    </span>
  );
}
