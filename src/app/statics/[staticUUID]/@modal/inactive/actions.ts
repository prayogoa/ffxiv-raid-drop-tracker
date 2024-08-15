"use server";
import { cache } from "react";
import { PlayerStatic, Player } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prismaClient";
import { sendBroadcastMessage } from "@/lib/supabase";

export const getInactivePlayersForStatic = cache(
  async function getInactivePlayersForStatic(staticUUID: PlayerStatic["slug"]) {
    return prisma.player.findMany({
      where: { static: { slug: staticUUID }, deletedAt: { not: null } },
    });
  },
);

export async function activatePlayer(playerId: Player["id"]) {
  const {
    static: { slug: staticUUID },
    ...player
  } = await prisma.player.update({
    where: { id: playerId },
    data: { deletedAt: null },
    include: { static: { select: { slug: true } } },
  });
  sendBroadcastMessage(staticUUID, "PlayerActivated", { staticUUID, player });
  // revalidatePath(`/statics/${staticUUID}/inactive`);
  return player;
}
