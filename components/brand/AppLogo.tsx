import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { APP_LOGO_ALT, APP_LOGO_SRC } from "@/lib/branding";

const SIZE_PX = { sm: 36, md: 52, lg: 72, xl: 88, hero: 120 } as const;

export function AppLogo({
  size = "md",
  showRing = true,
  className,
}: {
  size?: keyof typeof SIZE_PX;
  showRing?: boolean;
  className?: string;
}) {
  const px = SIZE_PX[size];
  const pad = Math.max(4, Math.round(px * 0.12));

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        showRing && "bg-gradient-to-br from-navy-800 to-navy-900 ring-2 ring-gold-600/40 shadow-[0_4px_16px_rgba(0,0,0,0.25)]",
        className,
      )}
      style={{ width: px, height: px }}
    >
      <Image
        src={APP_LOGO_SRC}
        alt={APP_LOGO_ALT}
        width={px}
        height={px}
        className="object-contain"
        style={{ padding: pad }}
        priority
      />
    </div>
  );
}
