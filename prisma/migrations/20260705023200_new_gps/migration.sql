-- CreateTable
CREATE TABLE "CallEncryptionAudit" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "callType" TEXT,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "keyFingerprint" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallEncryptionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallEncryptionAudit_conversationId_idx" ON "CallEncryptionAudit"("conversationId");

-- CreateIndex
CREATE INDEX "CallEncryptionAudit_createdAt_idx" ON "CallEncryptionAudit"("createdAt");
