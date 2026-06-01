"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronUp, LayoutDashboard, MessageSquare, Shield, UserPlus, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { AppLogo } from "@/components/brand/AppLogo";
import { AdminAvatar } from "@/components/ui/AdminAvatar";
import { isNavItemActive } from "@/lib/navigation";
import { APP_BRAND, LABEL_ADD_STAFF, LABEL_STAFF_OFFICERS, LABEL_STAFFS } from "@/lib/ui-labels";
import { cn } from "@/lib/utils/cn";
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED, useUiStore } from "@/stores/uiStore";

const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/members", label: LABEL_STAFFS, icon: Users },
  { href: "/members/add", label: LABEL_ADD_STAFF, icon: UserPlus },
  { href: "/system-users", label: LABEL_STAFF_OFFICERS, icon: Shield },
  { href: "/dm", label: "Messages", icon: MessageSquare },
] as const;

function AdminChip({ collapsed }: { collapsed: boolean }) {
  const { data } = useSession();
  const user = data?.user;
  return (
    <div
      className={cn("flex items-center gap-3 py-4", collapsed ? "justify-center px-2" : "px-4")}
      title={collapsed ? (user?.name ?? "Administrator") : undefined}
    >
      <AdminAvatar name={user?.name} email={user?.email} image={user?.image} size="sm" />
      {!collapsed ? (
        <>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.8rem] font-semibold text-white">{user?.name ?? "Administrator"}</div>
            <div className="text-[0.7rem] text-white/50">Administrator</div>
          </div>
          <ChevronUp className="h-4 w-4 shrink-0 text-white/30" aria-hidden />
        </>
      ) : null}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 hidden flex-col bg-[#0d1f3c] text-white shadow-[4px_0_24px_rgba(13,31,60,0.12)] transition-[width] duration-200 ease-out md:flex"
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
    >
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center border-b border-white/[0.06]",
          collapsed ? "justify-center px-2" : "gap-3 px-4",
        )}
      >
        <AppLogo size="md" showRing className={cn(collapsed && "mx-auto")} />
        {!collapsed ? (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[0.95rem] font-bold text-gold-500">{APP_BRAND}</div>
            <div className="text-[0.7rem] text-white/60">Personnel Management</div>
          </div>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="px-5 pb-2 pt-6 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/35">
          Navigation
        </div>
      ) : null}

      <nav className="flex-1 px-2 pb-4 pt-2">
        {NAV.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "nav-item relative mb-0.5 flex items-center rounded-lg text-sm transition-all duration-150 ease-out",
                collapsed ? "mx-2 justify-center px-0 py-2.5" : "mx-3 gap-3 px-4 py-2.5",
                isActive
                  ? "nav-item--active bg-[rgba(245,166,35,0.15)] font-semibold text-gold-500"
                  : "font-medium text-white/65 hover:bg-white/[0.07] hover:text-white/90",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-gold-500" : "text-white/45")} />
              {!collapsed ? item.label : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] px-2 py-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex h-9 w-full items-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80",
            collapsed ? "justify-center" : "gap-2 px-3",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed ? <span className="text-xs font-medium">Collapse</span> : null}
        </button>
      </div>

      <div className="mt-auto border-t border-white/[0.06]">
        <AdminChip collapsed={collapsed} />
      </div>
    </aside>
  );
}
