/** Preset departments for filters and combobox suggestions (value stored in DB). */
export const DEPARTMENT_PRESETS = [
  { value: "Finance", label: "Finance" },
  { value: "General Duties", label: "General Duties" },
  { value: "Orderly Room", label: "Orderly Room" },
  { value: "DOVVSU — Domestic Violence and Victim Support Unit", label: "DOVVSU — Domestic Violence and Victim Support Unit" },
  {
    value: "DOVVSU Charge Office — Domestic Violence and Victim Support Unit (Charge Office)",
    label: "DOVVSU Charge Office — Domestic Violence and Victim Support Unit (Charge Office)",
  },
  { value: "FPU — Formed Police Unit", label: "FPU — Formed Police Unit" },
  { value: "MTTD — Motor Traffic & Transport Department", label: "MTTD — Motor Traffic & Transport Department" },
  { value: "PID — Police Intelligence Department", label: "PID — Police Intelligence Department" },
  { value: "CID — Criminal Investigation Department", label: "CID — Criminal Investigation Department" },
  { value: "Narcotics — Narcotics Control", label: "Narcotics — Narcotics Control" },
  { value: "Marine Police", label: "Marine Police" },
  { value: "Airport Police", label: "Airport Police" },
  { value: "VIP Protection", label: "VIP Protection" },
  { value: "Administration", label: "Administration" },
] as const;

/** Legacy enum keys → display labels (for records created before string migration). */
const LEGACY_LABELS: Record<string, string> = {
  FPU: "FPU — Formed Police Unit",
  MTTD: "MTTD — Motor Traffic & Transport Department",
  PID: "PID — Police Intelligence Department",
  CID: "CID — Criminal Investigation Department",
  DOMESTIC_VIOLENCE: "DOVVSU — Domestic Violence and Victim Support Unit",
  NARCOTICS: "Narcotics — Narcotics Control",
  MARINE_POLICE: "Marine Police",
  AIRPORT_POLICE: "Airport Police",
  VIP_PROTECTION: "VIP Protection",
  GENERAL_DUTIES: "General Duties",
  ADMINISTRATION: "Administration",
  CRIMINAL_INVESTIGATIONS: "CID — Criminal Investigation Department",
  FINANCE: "Finance",
  ORDERLY_ROOM: "Orderly Room",
  DOVVSU: "DOVVSU — Domestic Violence and Victim Support Unit",
  DOVVSU_CHARGE_OFFICE: "DOVVSU Charge Office — Domestic Violence and Victim Support Unit (Charge Office)",
};

const ABBREV: Record<string, string> = {
  "Finance": "FIN",
  "General Duties": "GD",
  "Orderly Room": "OR",
  "FPU — Formed Police Unit": "FPU",
  "MTTD — Motor Traffic & Transport Department": "MTTD",
  "PID — Police Intelligence Department": "PID",
  "CID — Criminal Investigation Department": "CID",
  "DOVVSU — Domestic Violence and Victim Support Unit": "DOVVSU",
  "Narcotics — Narcotics Control": "NAR",
  "Marine Police": "MP",
  "Airport Police": "AP",
  "VIP Protection": "VIP",
  "Administration": "ADM",
  FPU: "FPU",
  MTTD: "MTTD",
  PID: "PID",
  CID: "CID",
  GENERAL_DUTIES: "GD",
  ADMINISTRATION: "ADM",
  NARCOTICS: "NAR",
  MARINE_POLICE: "MP",
  AIRPORT_POLICE: "AP",
  VIP_PROTECTION: "VIP",
  DOMESTIC_VIOLENCE: "DOVVSU",
};

export function formatDepartmentLabel(department: string): string {
  const trimmed = department.trim();
  if (!trimmed) return "—";
  return LEGACY_LABELS[trimmed] ?? trimmed;
}

export function departmentAbbrev(department: string): string {
  const label = formatDepartmentLabel(department);
  if (ABBREV[department]) return ABBREV[department]!;
  if (ABBREV[label]) return ABBREV[label]!;
  const acronym = label.match(/^([A-Z]{2,6})\s*—/)?.[1];
  if (acronym) return acronym;
  return label.slice(0, 3).toUpperCase();
}

/** @deprecated Use formatDepartmentLabel */
export const DEPARTMENT_LABELS = Object.fromEntries(
  DEPARTMENT_PRESETS.map((p) => [p.value, p.label]),
) as Record<string, string>;
