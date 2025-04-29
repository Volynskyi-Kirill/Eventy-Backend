/*
  Warnings:

  - You are about to drop the column `event_id` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `place_id` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `tickets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[event_zone_id,seat_number]` on the table `tickets` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `visibility` on the `locations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `event_zone_id` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seat_number` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VISIBILITY" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "TICKET_STATUS" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD');

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "visibility",
ADD COLUMN     "visibility" "VISIBILITY" NOT NULL;

-- AlterTable
ALTER TABLE "sold_tickets" ADD COLUMN     "sold_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "event_id",
DROP COLUMN "place_id",
DROP COLUMN "price",
ADD COLUMN     "event_zone_id" INTEGER NOT NULL,
ADD COLUMN     "seat_number" INTEGER NOT NULL,
ADD COLUMN     "status" "TICKET_STATUS" NOT NULL DEFAULT 'AVAILABLE';

-- DropEnum
DROP TYPE "Visibility";

-- CreateIndex
CREATE UNIQUE INDEX "tickets_event_zone_id_seat_number_key" ON "tickets"("event_zone_id", "seat_number");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_zone_id_fkey" FOREIGN KEY ("event_zone_id") REFERENCES "event_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
