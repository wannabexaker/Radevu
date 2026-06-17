-- AlterTable
ALTER TABLE "businesses"
ADD COLUMN     "category" TEXT,
ADD COLUMN     "description" TEXT;

-- Backfill existing live/demo businesses.
UPDATE "businesses"
SET "category" = 'Τεχνολογία'
WHERE "slug" = 'ioannis'
  AND "category" IS NULL;

UPDATE "businesses"
SET "category" = 'Εκπαίδευση'
WHERE "slug" = 'despoina'
  AND "category" IS NULL;
