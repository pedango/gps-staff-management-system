"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider basePath="/api/auth">
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "font-sans text-sm border border-navy-100 shadow-lg",
              title: "text-navy-900",
              description: "text-navy-500",
              success: "!border-l-4 !border-l-gold-600",
              error: "!border-l-4 !border-l-red-500",
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
