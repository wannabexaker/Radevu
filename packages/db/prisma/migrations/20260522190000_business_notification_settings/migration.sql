ALTER TABLE "businesses"
ADD COLUMN "notification_settings" JSONB NOT NULL DEFAULT '{"confirmation_enabled":true,"reminder_enabled":true,"reminder_lead_minutes":1440}';

UPDATE "businesses"
SET "notification_settings" = '{"confirmation_enabled":true,"reminder_enabled":true,"reminder_lead_minutes":1440}'::jsonb
WHERE "notification_settings" IS NULL;
