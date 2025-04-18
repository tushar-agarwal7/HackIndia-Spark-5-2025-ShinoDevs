-- CreateTable
CREATE TABLE "QuickLearnSession" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickLearnSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStatistic" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "totalLearningMinutes" INTEGER NOT NULL DEFAULT 0,
    "quickLearnSessionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuickLearnSession_sessionId_key" ON "QuickLearnSession"("sessionId");

-- CreateIndex
CREATE INDEX "QuickLearnSession_userId_idx" ON "QuickLearnSession"("userId");

-- CreateIndex
CREATE INDEX "QuickLearnSession_conversationId_idx" ON "QuickLearnSession"("conversationId");

-- CreateIndex
CREATE INDEX "QuickLearnSession_languageCode_idx" ON "QuickLearnSession"("languageCode");

-- CreateIndex
CREATE INDEX "UserStatistic_userId_idx" ON "UserStatistic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStatistic_userId_languageCode_key" ON "UserStatistic"("userId", "languageCode");

-- AddForeignKey
ALTER TABLE "QuickLearnSession" ADD CONSTRAINT "QuickLearnSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickLearnSession" ADD CONSTRAINT "QuickLearnSession_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStatistic" ADD CONSTRAINT "UserStatistic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
