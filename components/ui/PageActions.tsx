import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function PageActionGold({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("app-btn app-btn-gold", className)}>
      {children}
    </Link>
  );
}

export function PageActionOutline({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("app-btn app-btn-outline", className)}>
      {children}
    </Link>
  );
}

export function PageIconButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className={cn("app-icon-btn", className)} {...props}>
      {children}
    </button>
  );
}
