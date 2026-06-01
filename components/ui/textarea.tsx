import { cn } from "@/lib/utils/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[96px] w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-navy-950 shadow-sm placeholder:text-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-600",
        className,
      )}
      {...props}
    />
  );
});
