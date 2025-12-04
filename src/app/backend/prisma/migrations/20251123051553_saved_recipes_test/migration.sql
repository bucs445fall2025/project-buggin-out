-- DropForeignKey
ALTER TABLE "public"."SavedRecipe" DROP CONSTRAINT "SavedRecipe_recipeId_fkey";

-- AlterTable
ALTER TABLE "SavedRecipe" ALTER COLUMN "recipeId" SET DATA TYPE TEXT;
