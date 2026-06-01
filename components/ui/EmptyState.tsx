import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="app-empty-state" role="status">
      <div className="app-empty-state-icon" aria-hidden>
        {icon ?? <Inbox className="h-14 w-14" strokeWidth={1.25} />}
      </div>
      <h3 className="app-empty-state-title">{title}</h3>
      {description ? <p className="app-empty-state-desc">{description}</p> : null}
      {action ? <div className="app-empty-state-action">{action}</div> : null}
    </div>
  );
}
