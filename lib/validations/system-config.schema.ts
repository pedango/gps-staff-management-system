import { z } from "zod";

export const systemConfigSchema = z.object({
  regionName: z.string().trim().min(2).max(120),
  orgName: z.string().trim().min(2).max(120),
  systemTitle: z.string().trim().min(2).max(160),
  membersPageSize: z.coerce.number().int().min(10).max(100),
  enableDirectMessaging: z.boolean(),
  requireMemberPhoto: z.boolean(),
  maintenanceMode: z.boolean(),
});

export type SystemConfigInput = z.infer<typeof systemConfigSchema>;
