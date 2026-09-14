-- AlterTable
ALTER TABLE "notification_logs" ADD COLUMN "is_read" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "notification_logs_is_read_idx" ON "notification_logs"("is_read");
