"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { sanitizeFilterSelection, type MemberFilterOption } from "@/lib/member-filter-options";

export type FilterOption = MemberFilterOption;

type FilterPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  options: FilterOption[];
  selected: string[];
  onApply: (next: string[]) => void;
  searchable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
};

export function FilterPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  options,
  selected,
  onApply,
  searchable,
  loading,
  emptyMessage = "No options available yet.",
}: FilterPickerDialogProps) {
  const [draft, setDraft] = useState<string[]>(selected);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query, searchable]);

  const allVisibleSelected =
    visible.length > 0 && visible.every((o) => draft.includes(o.value));

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(sanitizeFilterSelection(selected, options));
      setQuery("");
    }
    onOpenChange(next);
  }

  function toggle(value: string) {
    setDraft((cur) => {
      const set = new Set(cur);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return Array.from(set);
    });
  }

  function selectAllVisible() {
    setDraft((cur) => {
      const set = new Set(cur);
      for (const opt of visible) {
        set.add(opt.value);
      }
      return Array.from(set);
    });
  }

  function clearVisible() {
    setDraft((cur) => cur.filter((v) => !visible.some((o) => o.value === v)));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="filter-picker-dialog max-w-md gap-0 p-0">
        <DialogHeader className="filter-picker-header mb-0 space-y-0">
          <DialogTitle className="filter-picker-title">{title}</DialogTitle>
          {description ? <DialogDescription className="filter-picker-desc">{description}</DialogDescription> : null}
        </DialogHeader>

        {searchable && options.length > 3 ? (
          <div className="filter-picker-search-wrap">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search options…"
              className="filter-picker-search"
              autoComplete="off"
              aria-label={`Search ${title.toLowerCase()}`}
            />
          </div>
        ) : null}

        {options.length > 1 && !loading ? (
          <div className="filter-picker-toolbar">
            <span className="filter-picker-toolbar-meta" aria-live="polite">
              {draft.length > 0 ? `${draft.length} selected` : "None selected"}
            </span>
            <button
              type="button"
              className="filter-picker-toolbar-btn"
              onClick={allVisibleSelected ? clearVisible : selectAllVisible}
              disabled={visible.length === 0}
            >
              {allVisibleSelected ? "Clear shown" : "Select all"}
            </button>
          </div>
        ) : null}

        <ul className="filter-picker-list" role="listbox" aria-multiselectable="true" aria-label={title}>
          {loading ? (
            <li className="filter-picker-empty">Loading…</li>
          ) : visible.length === 0 ? (
            <li className="filter-picker-empty">
              {options.length === 0 ? emptyMessage : "No matches for your search"}
            </li>
          ) : (
            visible.map((opt) => {
              const checked = draft.includes(opt.value);
              return (
                <li key={opt.value} className="filter-picker-row" role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(opt.value)}
                    className={cn("filter-picker-option", checked && "filter-picker-option--selected")}
                  >
                    <span className="filter-picker-option-label">{opt.label}</span>
                    <span
                      className={cn("filter-picker-check", checked && "filter-picker-check--on")}
                      aria-hidden
                    >
                      {checked ? <Check className="h-4 w-4" strokeWidth={2.5} /> : null}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="filter-picker-footer">
          <button
            type="button"
            className="filter-picker-reset"
            onClick={() => setDraft([])}
            disabled={draft.length === 0}
          >
            Reset
          </button>
          <button
            type="button"
            className="filter-picker-apply"
            onClick={() => {
              onApply(sanitizeFilterSelection(draft, options));
              onOpenChange(false);
            }}
          >
            Apply
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
