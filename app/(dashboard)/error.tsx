"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
      <h2 className="type-section-title">Something went wrong</h2>
      <p className="mt-2 text-sm">{error.message}</p>
      <Button type="button" className="mt-4 bg-navy-900 text-white hover:bg-navy-800" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
