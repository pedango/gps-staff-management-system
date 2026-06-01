import type { ReactNode } from "react";

export function AppPageHeader({
  title,
  subtitle,
  meta,
  actions,
}: {
  title?: string;
  subtitle?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className={title ? "app-page-header" : "app-page-toolbar"}>
      <div className="app-page-header-left">
        {title ? <h1 className="app-page-title">{title}</h1> : null}
        {subtitle ? <p className={title ? "app-page-subtitle" : "app-page-toolbar-subtitle"}>{subtitle}</p> : null}
        {meta ? <div className="app-page-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="app-page-header-actions">{actions}</div> : null}
    </header>
  );
}
