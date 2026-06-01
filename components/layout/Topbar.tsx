"use client";

import { Menu, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { DM_SEARCH_INPUT_CLASS } from "@/lib/dm-ui";
import { breadcrumbPageTitle, pageSubtitleForPath, pageTitleForPath } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import { UserMenu } from "@/components/layout/UserMenu";
import { useUiStore } from "@/stores/uiStore";
import { LABEL_STAFF_OFFICERS, LABEL_STAFFS } from "@/lib/ui-labels";
import { TYPE_CAPTION, TYPE_PAGE_TITLE } from "@/lib/typography";
import { cn } from "@/lib/utils/cn";

function showGlobalMemberSearch(pathname: string): boolean {
  return pathname === "/members" || pathname === "/system-users" || pathname === "/admins";
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const title = pageTitleForPath(pathname);
  const crumb = breadcrumbPageTitle(pathname);
  const subtitle = pageSubtitleForPath(pathname);
  const showBreadcrumb = crumb !== title && !subtitle;
  const showSearch = showGlobalMemberSearch(pathname);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    setSearchQ("");
  }, [pathname]);

  function onSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchQ.trim();
    if (pathname === "/system-users" || pathname === "/admins") {
      router.push(q ? `/system-users?q=${encodeURIComponent(q)}` : "/system-users");
      return;
    }
    router.push(q ? `/members?q=${encodeURIComponent(q)}` : "/members");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b border-navy-100 bg-white px-4 md:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2.5 text-left md:gap-3">
        <Button
          type="button"
          className="h-10 shrink-0 rounded-xl bg-navy-50 text-navy-800 hover:bg-navy-100 md:hidden"
          onClick={toggleSidebar}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          {showBreadcrumb ? (
            <nav className="mb-0.5 hidden sm:flex">
              <span className={cn(TYPE_CAPTION, "font-medium text-navy-500")}>{crumb}</span>
            </nav>
          ) : null}
          <h1 className={cn(TYPE_PAGE_TITLE, "truncate")}>{title}</h1>
          {subtitle ? <p className={cn(TYPE_CAPTION, "mt-0.5 hidden truncate sm:block")}>{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {showSearch ? (
          <form
            onSubmit={onSearchSubmit}
            className={cn("hidden sm:block", pathname === "/system-users" || pathname === "/admins" ? "w-[280px]" : "w-56 lg:w-72 xl:w-80")}
            role="search"
            aria-label="Search"
          >
            <div className="search-wrapper">
              <Search className="search-icon" aria-hidden />
              <Input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={
                  pathname === "/system-users" || pathname === "/admins"
                    ? `Search ${LABEL_STAFF_OFFICERS.toLowerCase()}…`
                    : `Search ${LABEL_STAFFS.toLowerCase()} by name, rank, or service number…`
                }
                className={cn(DM_SEARCH_INPUT_CLASS, "search-input")}
                aria-label={
                  pathname === "/system-users" || pathname === "/admins"
                    ? `${LABEL_STAFF_OFFICERS} search`
                    : `${LABEL_STAFFS} search`
                }
                autoComplete="off"
              />
            </div>
          </form>
        ) : null}
        {showSearch ? (
          <Button
            type="button"
            className="h-9 w-9 rounded-lg border border-navy-200 bg-navy-50 p-0 text-navy-500 hover:bg-navy-100 sm:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Button>
        ) : null}
        <div className="relative z-40 flex items-center gap-2">
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
