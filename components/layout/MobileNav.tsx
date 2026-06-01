"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Shield, UserPlus, Users, X } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { Button } from "@/components/ui/button";
import { isNavItemActive } from "@/lib/navigation";
import { APP_BRAND, LABEL_ADD_STAFF, LABEL_STAFF_OFFICERS, LABEL_STAFFS } from "@/lib/ui-labels";
import { cn } from "@/lib/utils/cn";
import { useUiStore } from "@/stores/uiStore";

const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/members", label: LABEL_STAFFS, icon: Users },
  { href: "/members/add", label: LABEL_ADD_STAFF, icon: UserPlus },
  { href: "/system-users", label: LABEL_STAFF_OFFICERS, icon: Shield },
  { href: "/dm", label: "Messages", icon: MessageSquare },
] as const;

export function MobileNav() {
  const open = useUiStore((s) => s.sidebarOpen);
  const setOpen = useUiStore((s) => s.setSidebarOpen);
  const pathname = usePathname();

  return (
    <div className={cn("fixed inset-0 z-50 md:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
      <button
        type="button"
        aria-label="Close navigation"
        className={cn("absolute inset-0 bg-navy-950/50 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={() => setOpen(false)}
      />
      <aside
        className={cn(
          "absolute left-0 top-0 flex h-full w-[240px] -translate-x-full flex-col border-r border-white/[0.06] bg-navy-900 text-white shadow-xl transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-white/[0.06] px-5">
          <div className="flex min-w-0 items-center gap-3">
            <AppLogo size="md" showRing />
            <div className="leading-tight">
              <div className="truncate text-sm font-bold text-gold-600">{APP_BRAND}</div>
              <div className="text-xs text-white/40">Personnel Management</div>
            </div>
          </div>
          <Button type="button" className="h-9 w-9 shrink-0 bg-transparent p-0 text-white hover:bg-white/10" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 pt-4">
          {NAV.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "mb-0.5 flex h-11 items-center gap-3 rounded-[10px] px-4 text-sm font-medium transition-all duration-150 ease-out",
                  isActive
                    ? "border-l-[3px] border-gold-600 bg-[rgba(230,168,23,0.12)] pl-[13px] text-gold-400"
                    : "border-l-[3px] border-transparent pl-4 text-white/55 hover:bg-white/[0.06] hover:text-white/85",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-gold-500" : "text-white/45")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
