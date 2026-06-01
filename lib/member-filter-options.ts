import type { MemberStatus } from "@prisma/client";
import { DEPARTMENT_PRESETS } from "@/lib/departments";
import { statusConfig } from "@/lib/member-status";

export type MemberFilterOption = { label: string; value: string };

/** Same values as the add/edit staff form status field. */
export const MEMBER_STATUS_VALUES: MemberStatus[] = [
  "ACTIVE",
  "SICK",
  "INJURED",
  "MATERNITY_LEAVE",
  "RETIRED",
];

export function getMemberStatusFilterOptions(): MemberFilterOption[] {
  return MEMBER_STATUS_VALUES.map((value) => ({
    value,
    label: statusConfig[value].label,
  }));
}

/** Same presets as the department field on the add/edit staff form. */
export function getDepartmentFilterOptions(): MemberFilterOption[] {
  return DEPARTMENT_PRESETS.map((p) => ({ value: p.value, label: p.label }));
}

export function stringsToFilterOptions(values: string[]): MemberFilterOption[] {
  return values
    .map((v) => v.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));
}

/** Keep URL-selected values visible even if not yet in the database. */
/** Drop URL/state values that are not in the current option list (e.g. removed statuses). */
export function sanitizeFilterSelection(
  selected: string[],
  options: MemberFilterOption[],
): string[] {
  if (selected.length === 0) return [];
  if (options.length === 0) return selected;
  const allowed = new Set(options.map((o) => o.value));
  return selected.filter((v) => allowed.has(v));
}

export function mergeFilterOptions(
  fromSource: MemberFilterOption[],
  selected: string[],
): MemberFilterOption[] {
  const byValue = new Map<string, MemberFilterOption>();
  for (const opt of fromSource) {
    byValue.set(opt.value, opt);
  }
  for (const value of selected) {
    const trimmed = value.trim();
    if (trimmed && !byValue.has(trimmed)) {
      byValue.set(trimmed, { label: trimmed, value: trimmed });
    }
  }
  return Array.from(byValue.values()).sort((a, b) => a.label.localeCompare(b.label));
}
