import type { Admin } from "@prisma/client";

export type AdminPublic = Pick<Admin, "id" | "name" | "email" | "avatar" | "role" | "createdAt">;
