/*
  Warnings:

  - You are about to drop the column `banner_img` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `event_img` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `location_id` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `preview_img` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `events` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ticket_id]` on the table `sold_tickets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `full_description` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `short_description` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_location_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_event_id_fkey";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "banner_img",
DROP COLUMN "description",
DROP COLUMN "duration",
DROP COLUMN "event_img",
DROP COLUMN "location_id",
DROP COLUMN "preview_img",
DROP COLUMN "subtitle",
DROP COLUMN "time",
ADD COLUMN     "building_number" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "cover_img" TEXT,
ADD COLUMN     "full_description" TEXT NOT NULL,
ADD COLUMN     "logo_img" TEXT,
ADD COLUMN     "main_img" TEXT,
ADD COLUMN     "short_description" TEXT NOT NULL,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_dates" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "event_id" INTEGER NOT NULL,

    CONSTRAINT "event_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_zones" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "seatCount" INTEGER NOT NULL,

    CONSTRAINT "event_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_social_media" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "link" TEXT NOT NULL,

    CONSTRAINT "event_social_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SpeakingEvents" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SpeakingEvents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CategoryToEvent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoryToEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SpeakingEvents_B_index" ON "_SpeakingEvents"("B");

-- CreateIndex
CREATE INDEX "_CategoryToEvent_B_index" ON "_CategoryToEvent"("B");

-- CreateIndex
CREATE UNIQUE INDEX "sold_tickets_ticket_id_key" ON "sold_tickets"("ticket_id");

-- AddForeignKey
ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_zones" ADD CONSTRAINT "event_zones_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_social_media" ADD CONSTRAINT "event_social_media_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpeakingEvents" ADD CONSTRAINT "_SpeakingEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpeakingEvents" ADD CONSTRAINT "_SpeakingEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToEvent" ADD CONSTRAINT "_CategoryToEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToEvent" ADD CONSTRAINT "_CategoryToEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
