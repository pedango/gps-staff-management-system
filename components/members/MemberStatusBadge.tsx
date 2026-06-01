import type { MemberStatus } from "@prisma/client";
import { statusConfig } from "@/lib/member-status";
import { cn } from "@/lib/utils/cn";

export function MemberStatusBadge({
  status,
  className,
  size = "default",
}: {
  status: MemberStatus;
  className?: string;
  size?: "default" | "lg";
}) {
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border text-xs font-medium",
        size === "lg" && "px-3 py-1.5 text-sm",
        size === "default" && "px-2.5 py-1",
        cfg.badgeClass,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.badgeDotClass)} aria-hidden />
      {cfg.label}
    </span>
  );
}
