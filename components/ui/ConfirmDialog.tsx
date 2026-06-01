"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  tone = "danger",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  tone?: "danger" | "default";
}) {
  const danger = tone === "danger";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-sm overflow-hidden rounded-2xl border border-navy-100 p-0 shadow-2xl",
          danger && "border-red-100",
        )}
      >
        {danger ? (
          <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <h2 className="type-section-title text-red-900">{title}</h2>
            </div>
          </div>
        ) : (
          <div className="border-b border-navy-100 px-5 py-4">
            <h2 className="type-section-title text-navy-900">{title}</h2>
          </div>
        )}
        {description ? <div className="px-5 py-4 text-sm text-navy-600">{description}</div> : null}
        <div className="flex justify-end gap-2 border-t border-navy-100 bg-navy-50/50 px-5 py-4">
          <Button
            type="button"
            className="rounded-xl border border-navy-200 bg-white text-navy-600 hover:bg-white"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={cn(
              "rounded-xl font-semibold",
              danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-gold-600 text-navy-900 hover:bg-gold-500",
            )}
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
