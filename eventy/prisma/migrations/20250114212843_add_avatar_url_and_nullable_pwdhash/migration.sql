-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ALTER COLUMN "pwd_hash" DROP NOT NULL;
