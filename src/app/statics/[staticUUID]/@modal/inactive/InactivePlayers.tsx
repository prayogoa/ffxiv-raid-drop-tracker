"use client";
import { useEffect } from "react";
import { Player, PlayerStatic } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activatePlayer, getInactivePlayersForStatic } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function InactivePlayers({
  staticUUID,
}: {
  staticUUID: PlayerStatic["slug"];
}) {
  useEffect(() => {
    console.log("mount");
    return () => {
      console.log("unmount");
    };
  }, []);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: players } = useQuery({
    queryKey: [{ scope: "PlayerList", staticUUID, active: false }],
    queryFn: () => {
      console.log("fetching inactive players list");
      return getInactivePlayersForStatic(staticUUID);
    },
  });
  const { mutateAsync } = useMutation({
    mutationFn: (playerId: Player["id"]) => activatePlayer(playerId),
    onMutate: async (playerId) => {
      const playerKey = [{ scope: "Player", playerId }],
        listKey = [{ scope: "PlayerList", staticUUID, active: false }];
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: listKey,
        }),
        queryClient.cancelQueries({
          queryKey: playerKey,
        }),
      ]);
      const previousInactivePlayers = queryClient.getQueryData<
        Player[] | undefined
      >(listKey);
      const previousPlayer = queryClient.getQueryData<Player | undefined>(
        playerKey,
      );
      if (!!previousInactivePlayers) {
        queryClient.setQueryData(
          listKey,
          previousInactivePlayers.filter((p) => p.id !== playerId),
        );
      }
      if (!!previousPlayer) {
        queryClient.setQueryData(playerKey, {
          ...previousPlayer,
          deletedAt: null,
        });
      }
      return { playerKey, listKey, previousPlayer, previousInactivePlayers };
    },
    onError: (err, newValues, context) => {
      if (!!context) {
        queryClient.setQueryData(context.playerKey, context.previousPlayer);
        queryClient.setQueryData(
          context.listKey,
          context.previousInactivePlayers,
        );
      }
    },
    onSettled: (_0, _1, _2, context) => {
      if (!!context) {
        queryClient.invalidateQueries({
          // invalidate both active and inactive list
          queryKey: [{ scope: "PlayerList", staticUUID }],
        });
        queryClient.invalidateQueries({ queryKey: context.playerKey });
      }
    },
  });
  console.log("render");
  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        console.log("onOpenChange", isOpen);
        !isOpen && router.push("./");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inactive players</DialogTitle>
          <div className="container grid gap-4">
            {players?.map((player) => (
              <div
                key={player.id}
                className="grid grid-cols-4 items-center gap-4"
              >
                <span className="col-span-2 overflow-hidden overflow-ellipsis text-nowrap">
                  {player.name}
                </span>
                <Button
                  variant="outline"
                  onClick={() => mutateAsync(player.id)}
                >
                  restore
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
