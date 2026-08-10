/*
  Warnings:

  - You are about to drop the column `heroTitle` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "heroTitle",
ADD COLUMN     "content" TEXT;
