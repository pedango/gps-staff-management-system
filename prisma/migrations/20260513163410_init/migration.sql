-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'SICK', 'INJURED', 'MATERNITY_LEAVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('FPU', 'MTTD', 'PID', 'CID', 'CRIMINAL_INVESTIGATIONS', 'DOMESTIC_VIOLENCE', 'NARCOTICS', 'MARINE_POLICE', 'AIRPORT_POLICE', 'VIP_PROTECTION', 'GENERAL_DUTIES', 'ADMINISTRATION');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PDF', 'IMAGE', 'VOICE');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "otherNames" TEXT,
    "dob" TIMESTAMP(3) NOT NULL,
    "sex" "Sex" NOT NULL,
    "rank" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "division" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "text" TEXT,
    "fileUrl" TEXT,
    "fileType" "FileType",
    "fileName" TEXT,
    "voiceUrl" TEXT,
    "voiceDuration" INTEGER,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Member_lastName_firstName_idx" ON "Member"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Member_district_idx" ON "Member"("district");

-- CreateIndex
CREATE INDEX "Member_division_idx" ON "Member"("division");

-- CreateIndex
CREATE INDEX "Member_station_idx" ON "Member"("station");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE INDEX "Member_contact_idx" ON "Member"("contact");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Message_receiverId_senderId_idx" ON "Message"("receiverId", "senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
