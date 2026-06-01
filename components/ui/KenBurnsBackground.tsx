import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export function KenBurnsBackground({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        sizes={sizes}
        className="login-ken-burns object-cover object-center"
      />
    </div>
  );
}
