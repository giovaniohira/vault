/*
  Warnings:

  - You are about to drop the column `authTag` on the `Credential` table. All the data in the column will be lost.
  - You are about to drop the column `iv` on the `Credential` table. All the data in the column will be lost.
  - You are about to drop the column `loginUsername` on the `Credential` table. All the data in the column will be lost.
  - Added the required column `loginUsernameEncrypted` to the `Credential` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordAuthTag` to the `Credential` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordIv` to the `Credential` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usernameAuthTag` to the `Credential` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usernameIv` to the `Credential` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Credential" DROP COLUMN "authTag",
DROP COLUMN "iv",
DROP COLUMN "loginUsername",
ADD COLUMN     "loginUsernameEncrypted" TEXT NOT NULL,
ADD COLUMN     "passwordAuthTag" TEXT NOT NULL,
ADD COLUMN     "passwordIv" TEXT NOT NULL,
ADD COLUMN     "usernameAuthTag" TEXT NOT NULL,
ADD COLUMN     "usernameIv" TEXT NOT NULL;
