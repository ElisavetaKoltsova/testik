-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TestSource" AS ENUM ('READY', 'CUSTOM');

-- CreateTable
CREATE TABLE "personal_tests" (
    "id" UUID NOT NULL,
    "ownerTelegramId" BIGINT NOT NULL,
    "subjectName" VARCHAR(100),
    "title" VARCHAR(200) NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "TestSource" NOT NULL,
    "readyTestId" VARCHAR(50),
    "readyTestVersion" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "shareCode" UUID NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "personal_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personal_tests_shareCode_key" ON "personal_tests"("shareCode");

-- CreateIndex
CREATE INDEX "personal_tests_ownerTelegramId_createdAt_idx" ON "personal_tests"("ownerTelegramId", "createdAt" DESC);
