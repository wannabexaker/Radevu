-- CreateTable
CREATE TABLE "business_managers" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'manager',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_managers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_managers_business_id_user_id_key" ON "business_managers"("business_id", "user_id");

-- CreateIndex
CREATE INDEX "business_managers_user_id_idx" ON "business_managers"("user_id");

-- AddForeignKey
ALTER TABLE "business_managers" ADD CONSTRAINT "business_managers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_managers" ADD CONSTRAINT "business_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
