"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils/cn";
import { useUiStore } from "@/stores/uiStore";

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDmRoute = pathname.startsWith("/dm");
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <div className="relative min-h-screen bg-navy-50">
      <a
        href="#main-content"
        className="absolute left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-lg transition focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <Sidebar />
      <MobileNav />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding-left] duration-200 ease-out",
          collapsed ? "md:pl-[72px]" : "md:pl-[288px]",
        )}
      >
        <Topbar />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "flex w-full flex-1 flex-col outline-none focus:outline-none",
            isDmRoute
              ? "min-h-0 overflow-hidden p-0"
              : "mx-auto min-h-0 max-w-[1600px] px-4 py-4 md:px-8 md:py-6",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
