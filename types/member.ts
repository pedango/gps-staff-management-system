import type { Department, Member, MemberStatus, Sex } from "@prisma/client";

export type MemberDTO = Member;

export type { Department, MemberStatus, Sex };

export type MemberListItem = Pick<
  Member,
  | "id"
  | "firstName"
  | "lastName"
  | "otherNames"
  | "rank"
  | "department"
  | "district"
  | "station"
  | "status"
  | "photo"
>;
