import { cn } from "@/lib/utils/cn";
import { forwardRef, type LabelHTMLAttributes } from "react";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn("type-body-sm font-medium leading-none text-navy-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  );
});
