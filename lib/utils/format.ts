import { differenceInYears, format } from "date-fns";

export function formatMemberName(
  firstName: string,
  lastName: string,
  otherNames?: string | null,
): string {
  const middle = otherNames?.trim();
  return middle ? `${firstName} ${middle} ${lastName}` : `${firstName} ${lastName}`;
}

export function formatGhanaPhone(contact: string): string {
  return contact.trim();
}

export function formatDisplayDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "dd MMM yyyy");
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "dd MMM yyyy, HH:mm");
}

export function calculateAge(dob: Date | string): number {
  const date = typeof dob === "string" ? new Date(dob) : dob;
  return differenceInYears(new Date(), date);
}
