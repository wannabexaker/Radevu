CREATE TABLE "contact_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "notification_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_requests_created_at_idx" ON "contact_requests"("created_at");
CREATE INDEX "contact_requests_email_idx" ON "contact_requests"("email");
