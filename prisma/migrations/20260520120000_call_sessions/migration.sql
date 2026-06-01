-- CreateEnum
CREATE TYPE "CallTypeEnum" AS ENUM ('AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "CallSessionStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateTable
CREATE TABLE "CallSession" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "conversationId" TEXT,
    "callType" "CallTypeEnum" NOT NULL,
    "status" "CallSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "CallSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "CallParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallSession_status_idx" ON "CallSession"("status");

-- CreateIndex
CREATE INDEX "CallSession_hostId_idx" ON "CallSession"("hostId");

-- CreateIndex
CREATE INDEX "CallParticipant_sessionId_idx" ON "CallParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "CallParticipant_adminId_idx" ON "CallParticipant"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "CallParticipant_sessionId_adminId_key" ON "CallParticipant"("sessionId", "adminId");

-- AddForeignKey
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallParticipant" ADD CONSTRAINT "CallParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CallSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallParticipant" ADD CONSTRAINT "CallParticipant_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
