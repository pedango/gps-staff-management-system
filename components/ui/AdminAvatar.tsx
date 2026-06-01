import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const PALETTES = [
  { bg: "bg-gradient-to-br from-navy-700 to-navy-900", text: "text-gold-400", ring: "ring-gold-500/30" },
  { bg: "bg-gradient-to-br from-emerald-700 to-teal-900", text: "text-emerald-100", ring: "ring-emerald-400/30" },
  { bg: "bg-gradient-to-br from-indigo-600 to-violet-900", text: "text-indigo-100", ring: "ring-indigo-400/30" },
  { bg: "bg-gradient-to-br from-amber-600 to-orange-800", text: "text-amber-50", ring: "ring-amber-400/30" },
  { bg: "bg-gradient-to-br from-slate-600 to-slate-900", text: "text-slate-100", ring: "ring-slate-400/30" },
] as const;

const SIZE_PX = { xs: 28, sm: 36, md: 40, lg: 48, xl: 64, "2xl": 80 } as const;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function adminInitials(name: string | null | undefined, email: string | null | undefined): string {
  const base = name?.trim() || email?.trim() || "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

export function AdminAvatar({
  name,
  email,
  image,
  size = "md",
  className,
  title,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: keyof typeof SIZE_PX;
  className?: string;
  title?: string;
}) {
  const px = SIZE_PX[size];
  const ini = adminInitials(name, email);
  const palette = PALETTES[hashString(`${name ?? ""}${email ?? ""}`) % PALETTES.length]!;

  if (image) {
    return (
      <span
        className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-white/20", className)}
        style={{ width: px, height: px }}
        title={title ?? name ?? undefined}
      >
        <Image src={image} alt="" width={px} height={px} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold shadow-inner ring-2",
        palette.bg,
        palette.text,
        palette.ring,
        size === "xs" && "text-[10px]",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        size === "lg" && "text-base",
        (size === "xl" || size === "2xl") && "text-lg",
        className,
      )}
      style={{ width: px, height: px }}
      title={title ?? name ?? undefined}
      aria-hidden={!title && !name}
    >
      {ini}
    </span>
  );
}
