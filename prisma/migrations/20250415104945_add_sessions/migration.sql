-- CreateEnum
CREATE TYPE "SpeakingSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "VocabularyPractice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "proficiencyLevel" "ProficiencyLevel" NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "percentageCorrect" INTEGER NOT NULL,
    "userChallengeId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyPractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarPractice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "proficiencyLevel" "ProficiencyLevel" NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "percentageCorrect" INTEGER NOT NULL,
    "grammarConcepts" TEXT,
    "userChallengeId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarPractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingPractice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "proficiencyLevel" "ProficiencyLevel" NOT NULL,
    "pronunciationScore" INTEGER NOT NULL,
    "fluencyScore" INTEGER NOT NULL,
    "accuracyScore" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "transcription" TEXT,
    "prompt" TEXT,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "audioUrl" TEXT,
    "userChallengeId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeakingPractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "proficiencyLevel" "ProficiencyLevel" NOT NULL,
    "ultravoxCallId" TEXT NOT NULL,
    "topic" TEXT,
    "userChallengeId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "status" "SpeakingSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "feedback" JSONB,

    CONSTRAINT "SpeakingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VocabularyPractice_userId_languageCode_idx" ON "VocabularyPractice"("userId", "languageCode");

-- CreateIndex
CREATE INDEX "VocabularyPractice_completedAt_idx" ON "VocabularyPractice"("completedAt");

-- CreateIndex
CREATE INDEX "GrammarPractice_userId_languageCode_idx" ON "GrammarPractice"("userId", "languageCode");

-- CreateIndex
CREATE INDEX "GrammarPractice_completedAt_idx" ON "GrammarPractice"("completedAt");

-- CreateIndex
CREATE INDEX "SpeakingPractice_userId_languageCode_idx" ON "SpeakingPractice"("userId", "languageCode");

-- CreateIndex
CREATE INDEX "SpeakingPractice_completedAt_idx" ON "SpeakingPractice"("completedAt");

-- CreateIndex
CREATE INDEX "SpeakingSession_userId_languageCode_idx" ON "SpeakingSession"("userId", "languageCode");

-- CreateIndex
CREATE INDEX "SpeakingSession_ultravoxCallId_idx" ON "SpeakingSession"("ultravoxCallId");

-- AddForeignKey
ALTER TABLE "VocabularyPractice" ADD CONSTRAINT "VocabularyPractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarPractice" ADD CONSTRAINT "GrammarPractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingPractice" ADD CONSTRAINT "SpeakingPractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingSession" ADD CONSTRAINT "SpeakingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
