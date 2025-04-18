/*
  Warnings:

  - You are about to drop the column `sessionId` on the `QuickLearnSession` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "QuickLearnSession_sessionId_key";

-- AlterTable
ALTER TABLE "QuickLearnSession" DROP COLUMN "sessionId";
