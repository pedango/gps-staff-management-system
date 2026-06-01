import { z } from "zod";

export const POLICE_RANKS = [
  "Inspector General",
  "Deputy Inspector General",
  "Commissioner",
  "Deputy Commissioner",
  "Assistant Commissioner",
  "Chief Superintendent",
  "Superintendent",
  "Deputy Superintendent",
  "Assistant Superintendent",
  "Inspector",
  "Sergeant",
  "Corporal",
  "Lance Corporal",
  "Constable",
] as const;

export const memberSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  otherNames: z.string().max(100).optional(),
  dob: z.coerce.date().max(new Date()),
  sex: z.enum(["MALE", "FEMALE"]),
  rank: z
    .string()
    .trim()
    .min(1, "Rank is required")
    .max(80, "Rank must be 80 characters or fewer"),
  contact: z
    .string()
    .regex(/^\+233[0-9]{9}$/, "Must be valid Ghana phone: +233XXXXXXXXX"),
  department: z.string().min(1, "Department is required").max(120),
  division: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  station: z.string().min(1).max(100),
  status: z.enum(["ACTIVE", "SICK", "INJURED", "MATERNITY_LEAVE", "RETIRED"]).default("ACTIVE"),
  photo: z.string().url().optional(),
});

export type MemberFormData = z.infer<typeof memberSchema>;
