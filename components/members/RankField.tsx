"use client";

import { POLICE_RANKS } from "@/lib/validations/member.schema";
import { cn } from "@/lib/utils/cn";

type RankFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  className?: string;
  listId?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
};

export function RankField({
  id = "rank",
  value,
  onChange,
  onBlur,
  name,
  className,
  listId = "rank-presets",
  placeholder = "Select or type rank",
  "aria-label": ariaLabel = "Rank",
  "aria-invalid": ariaInvalid,
}: RankFieldProps) {
  return (
    <>
      <input
        id={id}
        name={name}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        autoComplete="off"
        className={cn(className)}
      />
      <datalist id={listId}>
        {POLICE_RANKS.map((rank) => (
          <option key={rank} value={rank} />
        ))}
      </datalist>
    </>
  );
}
