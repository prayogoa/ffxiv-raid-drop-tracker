"use server";
import { cache } from "react";
import { Player, PlayerGearChoice, PlayerStatic, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createPlayerFormValidator } from "./validators";
import { prisma as prismaClient } from "@/lib/prismaClient";
import { sendBroadcastMessage } from "@/lib/supabase";

export const getPlayerListForStatic = cache(
  async (staticUUID: PlayerStatic["slug"]) => {
    return prismaClient.player.findMany({
      where: { static: { slug: staticUUID }, deletedAt: null },
      orderBy: [{ id: "asc" }],
    });
  },
);

export async function deletePlayer(playerId: Player["id"]) {
  const {
    static: { slug: staticUUID },
    ...player
  } = await prismaClient.player.update({
    where: { id: playerId },
    data: { deletedAt: new Date() },
    include: { static: { select: { slug: true } } },
  });
  sendBroadcastMessage(staticUUID, "PlayerDeleted", {
    staticUUID,
    player,
  });
  revalidatePath(`/statics/${staticUUID}/inactive`);
  return player;
}

export const getOrCreatePlayerGearChoice = cache(
  async (playerId: Player["id"]) => {
    return await prismaClient.playerGearChoice.upsert({
      where: { playerId },
      update: {},
      create: { playerId },
      include: { Player: true },
    });
  },
);

export async function createPlayer(
  name: Player["name"],
  role: Player["role"],
  staticUUID: PlayerStatic["slug"],
) {
  try {
    const playerStatic = await prismaClient.playerStatic.findUniqueOrThrow({
      where: { slug: staticUUID },
    });
    const player = await prismaClient.player.create({
      data: {
        ...createPlayerFormValidator.parse({ name, role }),
        staticId: playerStatic.id,
      },
    });
    sendBroadcastMessage(
      playerStatic.slug,
      "PlayerStaticUpdated",
      playerStatic,
    );
    return player;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
      }
    }
    throw err;
  }
}

export async function updatePlayer(
  playerId: Player["id"],
  update: Prisma.PlayerUpdateInput,
) {
  const playerPromise = prismaClient.player.update({
    where: { id: playerId },
    data: update,
    include: { static: { select: { slug: true } } },
  });

  playerPromise.then((player) =>
    sendBroadcastMessage(player.static.slug, "PlayerUpdated", player),
  );
  return playerPromise;
}

export async function updateGearChoice(
  playerId: Player["id"],
  update: Prisma.PlayerGearChoiceUpdateInput,
) {
  const { Player, ...playerGearChoice } =
    await prismaClient.playerGearChoice.update({
      where: { playerId: playerId },
      data: update,
      include: { Player: { select: { static: { select: { slug: true } } } } },
    });
  sendBroadcastMessage(
    Player.static.slug,
    "PlayerGearChoiceUpdated",
    playerGearChoice,
  );
  return playerGearChoice;
}

export const getPlayer = cache(async (playerId: Player["id"]) => {
  return prismaClient.player.findUniqueOrThrow({ where: { id: playerId } });
});
