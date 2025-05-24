/*
  Warnings:

  - Added the required column `payment_method` to the `sold_tickets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sold_tickets" ADD COLUMN     "payment_method" TEXT NOT NULL,
ADD COLUMN     "purchase_contact_id" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "marketing_consent" BOOLEAN;

-- CreateTable
CREATE TABLE "purchase_contact_info" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "agree_to_terms" BOOLEAN NOT NULL,
    "marketing_consent" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_contact_info_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sold_tickets" ADD CONSTRAINT "sold_tickets_purchase_contact_id_fkey" FOREIGN KEY ("purchase_contact_id") REFERENCES "purchase_contact_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;
