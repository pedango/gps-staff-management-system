import { cn } from "@/lib/utils/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-lg border border-navy-200 bg-white px-3.5 text-sm text-navy-900 shadow-sm placeholder:text-navy-400 focus-visible:border-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-100",
        className,
      )}
      {...props}
    />
  );
});
