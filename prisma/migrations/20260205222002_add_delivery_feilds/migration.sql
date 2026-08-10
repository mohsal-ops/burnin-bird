-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "apt" TEXT,
ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "deliveryLat" DOUBLE PRECISION,
ADD COLUMN     "deliveryLng" DOUBLE PRECISION,
ADD COLUMN     "deliveryPlaceId" TEXT,
ADD COLUMN     "instructions" TEXT,
ALTER COLUMN "pickupDay" DROP NOT NULL,
ALTER COLUMN "pickupTime" DROP NOT NULL;
