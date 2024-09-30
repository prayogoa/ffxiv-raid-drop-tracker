"use client";

import { useCallback, useState } from "react";
import { PlayerStatic, Player, PrismaClient } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { NewPlayerInput } from "./NewPlayerInput";
import {
  getPlayerListForStatic,
  updatePlayer,
  getPlayer,
  deletePlayer,
} from "./actions";
import { GearChoiceCells } from "./GearChoiceCells";
import { PlayerNameCell } from "./PlayerNameCell";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function PlayerRow({
  playerId,
  staticUUID,
}: {
  playerId: Player["id"];
  staticUUID: PlayerStatic["slug"];
}) {
  const queryClient = useQueryClient();
  const { data: player } = useQuery({
    queryFn: () => getPlayer(playerId),
    queryKey: [{ scope: "Player", playerId }],
  });
  const { mutateAsync } = useMutation({
    mutationFn: (playerId: Player["id"]) => deletePlayer(playerId),
    onMutate: async (playerId) => {
      const queryKey = [{ scope: "PlayerList", staticUUID }];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Player[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previous.filter((player) => player.id !== playerId),
      );
      return { previous, playerId, staticUUID };
    },
    onError: (err, newValues, context) => {
      context &&
        queryClient.setQueryData(
          [{ scope: "PlayerList", staticUUID: context.staticUUID }],
          context.previous,
        );
    },
    onSettled: (_0, _1, _2, context) => {
      context &&
        queryClient.invalidateQueries({
          queryKey: [{ scope: "PlayerList", staticUUID: context.staticUUID }],
        });
    },
  });
  const onClickDelete = useCallback(() => {
    mutateAsync(playerId);
  }, [mutateAsync, playerId]);
  return (
    <TableRow className="grid grid-cols-[repeat(2,1fr_min-content)] xl:table-row">
      <PlayerNameCell player={player} />
      <TableCell className="row-start1 col-span-1 block xl:table-cell">
        <div className="px-3 py-2">
          {player?.role || <Skeleton className="h-4" />}
        </div>
      </TableCell>
      <GearChoiceCells playerId={playerId} />
      <TableCell className="col-span-1 col-start-4 row-start-1 block xl:table-cell">
        <form action={onClickDelete}>
          <Button variant="ghost" className="w-fit" type="submit" size="icon">
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </form>
      </TableCell>
    </TableRow>
  );
}

export default function PlayerStaticTableBody({
  staticUUID,
}: {
  staticUUID: PlayerStatic["slug"];
}) {
  const { data: players } = useQuery({
    queryKey: [{ scope: "PlayerList", staticUUID }],
    queryFn: () => getPlayerListForStatic(staticUUID),
  });
  if (players === undefined) {
    return null;
  }
  return (
    <>
      {players.map((player) => (
        <PlayerRow
          key={player.id}
          playerId={player.id}
          staticUUID={staticUUID}
        />
      ))}
      <NewPlayerInput staticUUID={staticUUID} />
    </>
  );
}
