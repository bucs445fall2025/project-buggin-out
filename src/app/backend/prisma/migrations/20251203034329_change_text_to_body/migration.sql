/*
  Warnings:

  - You are about to drop the column `text` on the `PostComment` table. All the data in the column will be lost.
  - Added the required column `body` to the `PostComment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PostComment" DROP COLUMN "text",
ADD COLUMN     "body" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PostLike" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
