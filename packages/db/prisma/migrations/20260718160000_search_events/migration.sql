-- CreateTable
CREATE TABLE "search_events" (
    "id" TEXT NOT NULL,
    "query" TEXT,
    "category" TEXT,
    "results_count" INTEGER NOT NULL,
    "user_id" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_events_created_at_idx" ON "search_events"("created_at");

-- CreateIndex
CREATE INDEX "search_events_query_idx" ON "search_events"("query");

-- CreateIndex
CREATE INDEX "search_events_user_id_idx" ON "search_events"("user_id");

-- AddForeignKey
ALTER TABLE "search_events" ADD CONSTRAINT "search_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
