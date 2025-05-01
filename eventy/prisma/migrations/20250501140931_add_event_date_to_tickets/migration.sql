/*
  Warnings:

  - A unique constraint covering the columns `[event_zone_id,event_date_id,seat_number]` on the table `tickets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `event_date_id` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tickets_event_zone_id_seat_number_key";

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "event_date_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tickets_event_zone_id_event_date_id_seat_number_key" ON "tickets"("event_zone_id", "event_date_id", "seat_number");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_date_id_fkey" FOREIGN KEY ("event_date_id") REFERENCES "event_dates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
