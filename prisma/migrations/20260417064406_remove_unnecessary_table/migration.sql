/*
  Warnings:

  - You are about to drop the column `categoryId` on the `svg_files` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `svg_files` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `svg_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "svg_files" DROP CONSTRAINT "svg_files_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "svg_files" DROP CONSTRAINT "svg_files_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "svg_tags" DROP CONSTRAINT "svg_tags_svgFileId_fkey";

-- DropForeignKey
ALTER TABLE "svg_tags" DROP CONSTRAINT "svg_tags_tagId_fkey";

-- DropIndex
DROP INDEX "svg_files_categoryId_idx";

-- DropIndex
DROP INDEX "svg_files_ownerId_idx";

-- DropIndex
DROP INDEX "svg_files_visibility_createdAt_idx";

-- DropIndex
DROP INDEX "svg_files_visibility_idx";

-- AlterTable
ALTER TABLE "svg_files" DROP COLUMN "categoryId",
DROP COLUMN "ownerId",
ADD COLUMN     "userId" TEXT;

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "svg_tags";

-- DropTable
DROP TABLE "tags";

-- AddForeignKey
ALTER TABLE "svg_files" ADD CONSTRAINT "svg_files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
