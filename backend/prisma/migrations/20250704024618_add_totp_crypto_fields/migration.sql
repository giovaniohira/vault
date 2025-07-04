/*
  Warnings:

  - Added the required column `authTag` to the `TOTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iv` to the `TOTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salt` to the `TOTP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TOTP" ADD COLUMN     "authTag" TEXT NOT NULL,
ADD COLUMN     "iv" TEXT NOT NULL,
ADD COLUMN     "salt" TEXT NOT NULL;
