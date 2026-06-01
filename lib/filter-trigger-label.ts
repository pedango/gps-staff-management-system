import { sanitizeFilterSelection, type MemberFilterOption } from "@/lib/member-filter-options";

/** Label for dropdown triggers: "All statuses" or selection summary. */
export function formatFilterTriggerLabel(
  defaultLabel: string,
  selected: string[],
  options: MemberFilterOption[],
  maxChars = 28,
): string {
  const validSelected = sanitizeFilterSelection(selected, options);
  if (validSelected.length === 0) return defaultLabel;

  if (validSelected.length === 1) {
    const match = options.find((o) => o.value === validSelected[0]);
    const text = match?.label ?? validSelected[0];
    if (text.length <= maxChars) return text;
    return `${text.slice(0, maxChars - 1)}…`;
  }

  return `${validSelected.length} selected`;
}
