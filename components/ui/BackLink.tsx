"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="profile-back-link">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  );
}
