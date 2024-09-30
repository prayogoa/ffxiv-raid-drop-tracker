-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_staticId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerGearChoice" DROP CONSTRAINT "PlayerGearChoice_playerId_fkey";

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_staticId_fkey" FOREIGN KEY ("staticId") REFERENCES "PlayerStatic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGearChoice" ADD CONSTRAINT "PlayerGearChoice_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
