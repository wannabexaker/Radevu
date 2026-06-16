-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE "user_type" AS ENUM ('customer', 'business_owner');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "user_type" "user_type" NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: every user who currently owns a business is a business_owner.
UPDATE "users"
SET "user_type" = 'business_owner'
WHERE "id" IN (SELECT "owner_id" FROM "businesses");

-- AlterTable
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customers_user_id_fkey'
  ) THEN
    ALTER TABLE "customers"
      ADD CONSTRAINT "customers_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customers_user_id_idx" ON "customers"("user_id");
