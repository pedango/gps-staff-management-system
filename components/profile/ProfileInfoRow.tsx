import type { ReactNode } from "react";

export function ProfileInfoRow({ label, value, valueNode }: { label: string; value?: string; valueNode?: ReactNode }) {
  return (
    <div className="profile-info-row">
      <span className="profile-info-label">{label}</span>
      <div className="profile-info-value-col">
        {valueNode ?? <span className="profile-info-value">{value}</span>}
      </div>
    </div>
  );
}
