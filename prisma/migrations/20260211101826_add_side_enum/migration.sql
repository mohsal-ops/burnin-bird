/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `SideGroup` table. All the data in the column will be lost.
  - You are about to drop the column `extraPriceInCents` on the `SideOption` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `SideOption` table. All the data in the column will be lost.
  - Added the required column `label` to the `SideOption` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SideGroupType" ADD VALUE 'NO';
ALTER TYPE "SideGroupType" ADD VALUE 'EXTRA';

-- DropForeignKey
ALTER TABLE "SideOption" DROP CONSTRAINT "SideOption_itemId_fkey";

-- AlterTable
ALTER TABLE "SideGroup" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "SideOption" DROP COLUMN "extraPriceInCents",
DROP COLUMN "itemId",
ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "linkedItemId" TEXT,
ADD COLUMN     "priceInCents" INTEGER;
