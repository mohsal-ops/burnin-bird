-- Owner-controlled display order for modifier groups and their options.
ALTER TABLE "SideGroup" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SideOption" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
