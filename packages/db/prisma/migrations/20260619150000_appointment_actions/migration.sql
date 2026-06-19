-- CreateEnum
CREATE TYPE "RescheduleStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "appointments"
ADD COLUMN "cancellation_reason" TEXT,
ADD COLUMN "action_token" TEXT,
ADD COLUMN "reschedule_status" "RescheduleStatus",
ADD COLUMN "reschedule_requested_start" TIMESTAMP(3),
ADD COLUMN "reschedule_requested_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "appointments_action_token_key" ON "appointments"("action_token");
