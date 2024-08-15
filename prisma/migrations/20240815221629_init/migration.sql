-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Tank', 'Healer', 'Dps');

-- CreateEnum
CREATE TYPE "GearType" AS ENUM ('Raid', 'Tome', 'Crafted');

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "staticId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGearChoice" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "weapon" "GearType",
    "weaponObtained" BOOLEAN NOT NULL DEFAULT false,
    "head" "GearType",
    "headObtained" BOOLEAN NOT NULL DEFAULT false,
    "chest" "GearType",
    "chestObtained" BOOLEAN NOT NULL DEFAULT false,
    "hands" "GearType",
    "handsObtained" BOOLEAN NOT NULL DEFAULT false,
    "legs" "GearType",
    "legsObtained" BOOLEAN NOT NULL DEFAULT false,
    "feet" "GearType",
    "feetObtained" BOOLEAN NOT NULL DEFAULT false,
    "earring" "GearType",
    "earringObtained" BOOLEAN NOT NULL DEFAULT false,
    "necklace" "GearType",
    "necklaceObtained" BOOLEAN NOT NULL DEFAULT false,
    "bracelet" "GearType",
    "braceletObtained" BOOLEAN NOT NULL DEFAULT false,
    "ring1" "GearType",
    "ring1Obtained" BOOLEAN NOT NULL DEFAULT false,
    "ring2" "GearType",
    "ring2Obtained" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlayerGearChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStatic" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PlayerStatic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_staticId_key" ON "Player"("name", "staticId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGearChoice_playerId_key" ON "PlayerGearChoice"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStatic_slug_key" ON "PlayerStatic"("slug");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_staticId_fkey" FOREIGN KEY ("staticId") REFERENCES "PlayerStatic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGearChoice" ADD CONSTRAINT "PlayerGearChoice_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
