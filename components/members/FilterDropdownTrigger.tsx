"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type FilterDropdownTriggerProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  className?: string;
};

export function FilterDropdownTrigger({ label, active, onClick, className }: FilterDropdownTriggerProps) {
  return (
    <button
      type="button"
      className={cn("filter-dropdown-trigger", active && "filter-dropdown-trigger--active", className)}
      onClick={onClick}
      aria-haspopup="dialog"
    >
      <span className="filter-dropdown-trigger-label">{label}</span>
      <ChevronDown className="filter-dropdown-trigger-chevron" strokeWidth={2.5} aria-hidden />
    </button>
  );
}
