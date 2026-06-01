import type { ReactNode } from "react";
import {
  APP_BRAND,
  LABEL_ADD_STAFF,
  LABEL_EDIT_STAFF,
  LABEL_STAFF_OFFICERS,
  LABEL_STAFF_PROFILE,
  LABEL_STAFFS,
} from "@/lib/ui-labels";

const TITLE_MAP: Record<string, string> = {
  "/": "Overview",
  "/members": LABEL_STAFFS,
  "/members/add": LABEL_ADD_STAFF,
  "/system-users": LABEL_STAFF_OFFICERS,
  "/admins": LABEL_STAFF_OFFICERS,
  "/dm": "Messages",
  "/profile": "My Profile",
  "/settings": "Settings",
};

export function titleForPathname(pathname: string): string {
  if (TITLE_MAP[pathname]) {
    return TITLE_MAP[pathname] ?? APP_BRAND;
  }
  if (pathname.startsWith("/dm/")) {
    return "Direct Message";
  }
  if (pathname.includes("/members/") && pathname.endsWith("/edit")) {
    return LABEL_EDIT_STAFF;
  }
  if (pathname.startsWith("/members/")) {
    return LABEL_STAFF_PROFILE;
  }
  return APP_BRAND;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="app-page-header mb-0">
      <div className="app-page-header-left">
        <h1 className="app-page-title">{title}</h1>
        {description ? <p className="app-page-subtitle">{description}</p> : null}
      </div>
      {actions ? <div className="app-page-header-actions">{actions}</div> : null}
    </header>
  );
}
