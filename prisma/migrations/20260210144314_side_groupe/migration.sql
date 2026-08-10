-- CreateEnum
CREATE TYPE "SideGroupType" AS ENUM ('SIDE', 'SPICE', 'RECOMMENDED');

-- CreateTable
CREATE TABLE "SideGroup" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "SideGroupType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "maxSelect" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SideGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SideOption" (
    "id" TEXT NOT NULL,
    "sideGroupId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "extraPriceInCents" INTEGER,

    CONSTRAINT "SideOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SideGroup" ADD CONSTRAINT "SideGroup_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideOption" ADD CONSTRAINT "SideOption_sideGroupId_fkey" FOREIGN KEY ("sideGroupId") REFERENCES "SideGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideOption" ADD CONSTRAINT "SideOption_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
