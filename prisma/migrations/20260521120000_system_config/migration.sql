-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "regionName" TEXT NOT NULL DEFAULT 'Eastern North Region',
    "orgName" TEXT NOT NULL DEFAULT 'Ghana Police Service',
    "systemTitle" TEXT NOT NULL DEFAULT 'Personnel Management System',
    "membersPageSize" INTEGER NOT NULL DEFAULT 20,
    "enableDirectMessaging" BOOLEAN NOT NULL DEFAULT true,
    "requireMemberPhoto" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SystemConfig" ("id", "updatedAt")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
