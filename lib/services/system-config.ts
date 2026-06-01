import { prisma } from "@/lib/prisma";
import type { SystemConfigInput } from "@/lib/validations/system-config.schema";

const DEFAULT_ID = "default";

const DEFAULTS: SystemConfigInput = {
  regionName: "Eastern North Region",
  orgName: "Ghana Police Service",
  systemTitle: "Personnel Management System",
  membersPageSize: 20,
  enableDirectMessaging: true,
  requireMemberPhoto: false,
  maintenanceMode: false,
};

export type SystemConfigDto = SystemConfigInput & {
  updatedAt: string;
};

export async function getSystemConfig(): Promise<SystemConfigDto> {
  const row = await prisma.systemConfig.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID, ...DEFAULTS },
    update: {},
  });

  return {
    regionName: row.regionName,
    orgName: row.orgName,
    systemTitle: row.systemTitle,
    membersPageSize: row.membersPageSize,
    enableDirectMessaging: row.enableDirectMessaging,
    requireMemberPhoto: row.requireMemberPhoto,
    maintenanceMode: row.maintenanceMode,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateSystemConfig(input: SystemConfigInput): Promise<SystemConfigDto> {
  const row = await prisma.systemConfig.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID, ...input },
    update: input,
  });

  return {
    regionName: row.regionName,
    orgName: row.orgName,
    systemTitle: row.systemTitle,
    membersPageSize: row.membersPageSize,
    enableDirectMessaging: row.enableDirectMessaging,
    requireMemberPhoto: row.requireMemberPhoto,
    maintenanceMode: row.maintenanceMode,
    updatedAt: row.updatedAt.toISOString(),
  };
}
