/*
  Warnings:

  - Added the required column `authTag` to the `Credential` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iv` to the `Credential` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salt` to the `Credential` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "authTag" TEXT NOT NULL,
ADD COLUMN     "iv" TEXT NOT NULL,
ADD COLUMN     "salt" TEXT NOT NULL;
