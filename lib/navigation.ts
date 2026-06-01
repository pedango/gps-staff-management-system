/** True when a sidebar nav item should show the active state. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/members") {
    if (pathname === "/members") return true;
    if (pathname.startsWith("/members/") && pathname !== "/members/add") return true;
    return false;
  }
  if (href === "/members/add") {
    return pathname === "/members/add";
  }
  if (href === "/dm") {
    return pathname === "/dm" || pathname.startsWith("/dm/");
  }
  if (href === "/system-users") {
    return pathname === "/system-users" || pathname === "/admins";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

import {
  APP_BRAND,
  LABEL_ADD_STAFF,
  LABEL_EDIT_STAFF,
  LABEL_STAFF_OFFICERS,
  LABEL_STAFF_PROFILE,
  LABEL_STAFFS,
  LABEL_STAFFS_RECORDS,
} from "@/lib/ui-labels";

/** Breadcrumb segment for current route (after Ghana Police Service). */
export function breadcrumbPageTitle(pathname: string): string {
  if (pathname === "/") return "Overview";
  if (pathname === "/members") return LABEL_STAFFS_RECORDS;
  if (pathname === "/members/add") return LABEL_ADD_STAFF;
  if (pathname.startsWith("/members/") && pathname.endsWith("/edit")) return LABEL_EDIT_STAFF;
  if (pathname.startsWith("/members/")) return LABEL_STAFF_PROFILE;
  if (pathname === "/system-users" || pathname === "/admins") return LABEL_STAFF_OFFICERS;
  if (pathname === "/profile") return "My Profile";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/dm" || pathname.startsWith("/dm/")) return "Messages";
  return APP_BRAND;
}

/** Main heading in the top bar. */
export function pageTitleForPath(pathname: string): string {
  if (pathname === "/") return "Overview";
  if (pathname === "/members") return LABEL_STAFFS_RECORDS;
  if (pathname === "/system-users" || pathname === "/admins") return LABEL_STAFF_OFFICERS;
  if (pathname === "/dm" || pathname.startsWith("/dm/")) return "Messages";
  return breadcrumbPageTitle(pathname);
}

/** Optional subtitle under the top-bar title. */
export function pageSubtitleForPath(pathname: string): string | null {
  if (pathname === "/system-users" || pathname === "/admins") {
    return "Authorised staff officers — Eastern North Region";
  }
  return null;
}