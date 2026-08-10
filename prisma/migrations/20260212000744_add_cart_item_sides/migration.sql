-- CreateTable
CREATE TABLE "CartItemSide" (
    "id" TEXT NOT NULL,
    "cartItemId" TEXT NOT NULL,
    "sideGroupId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceInCents" INTEGER,

    CONSTRAINT "CartItemSide_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CartItemSide" ADD CONSTRAINT "CartItemSide_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
