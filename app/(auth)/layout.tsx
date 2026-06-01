import type { ReactNode } from "react";

/** Locks auth routes to the viewport — no document scroll (per enterprise login spec). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh max-h-dvh min-h-0 overflow-hidden overscroll-none">{children}</div>
  );
}
