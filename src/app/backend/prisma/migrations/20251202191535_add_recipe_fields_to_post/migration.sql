/*
  Warnings:

  - Added the required column `area` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ingredients` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructions` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "area" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "ingredients" JSONB NOT NULL,
ADD COLUMN     "instructions" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;
