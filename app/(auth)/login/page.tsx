import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { LoginLeftPanel } from "./LoginLeftPanel";

export default function LoginPage() {
  return (
    <div className="login-root">
      <LoginLeftPanel />
      <Suspense
        fallback={
          <main className="login-right">
            <p className="text-sm text-gray-500">Loading…</p>
          </main>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
