-- Split appointment notes into owner-private and customer-visible fields.
-- Existing notes came from the public booking form, so keep them as customer notes.
ALTER TABLE "appointments" ADD COLUMN "customer_note" TEXT;
ALTER TABLE "appointments" ADD COLUMN "customer_private_note" TEXT;
ALTER TABLE "appointments" ADD COLUMN "guest_token_hash" TEXT;
ALTER TABLE "appointments" ADD COLUMN "guest_token_expires_at" TIMESTAMP(3);

UPDATE "appointments"
SET "customer_note" = "notes"
WHERE "notes" IS NOT NULL;

UPDATE "appointments"
SET "notes" = NULL
WHERE "notes" IS NOT NULL;

CREATE TYPE "AppointmentMessageAuthorRole" AS ENUM ('business', 'customer');

CREATE TABLE "appointment_messages" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "author_role" "AppointmentMessageAuthorRole" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointments_guest_token_hash_idx" ON "appointments"("guest_token_hash");
CREATE INDEX "appointment_messages_business_id_appointment_id_created_at_idx" ON "appointment_messages"("business_id", "appointment_id", "created_at");

ALTER TABLE "appointment_messages" ADD CONSTRAINT "appointment_messages_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointment_messages" ADD CONSTRAINT "appointment_messages_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
