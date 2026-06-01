"use client";

import { DEPARTMENT_PRESETS } from "@/lib/departments";
import { cn } from "@/lib/utils/cn";

type DepartmentFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  listId?: string;
  placeholder?: string;
  "aria-label"?: string;
};

export function DepartmentField({
  id = "department",
  value,
  onChange,
  className,
  listId = "department-presets",
  placeholder = "Select or type department name",
  "aria-label": ariaLabel = "Department",
}: DepartmentFieldProps) {
  return (
    <>
      <input
        id={id}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        className={cn(className)}
      />
      <datalist id={listId}>
        {DEPARTMENT_PRESETS.map((p) => (
          <option key={p.value} value={p.label} />
        ))}
      </datalist>
    </>
  );
}
