-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "favorite" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TOTP" ADD COLUMN     "favorite" BOOLEAN NOT NULL DEFAULT false;
