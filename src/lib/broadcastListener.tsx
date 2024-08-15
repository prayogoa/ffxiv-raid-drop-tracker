"use client";
import { useMemo, useSyncExternalStore, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { client as supabaseClient } from "./supabase";

const stablesnapshot = {};
function getSnapshot() {
  return stablesnapshot;
}
export function BroadcastListener({
  children,
  staticUUID,
}: {
  children: ReactNode;
  staticUUID: string;
}) {
  const queryClient = useQueryClient();
  const subscribe = useMemo(() => {
    return function subscribe(callback: () => void) {
      const channel = supabaseClient.channel(staticUUID);
      channel
        .on(
          "broadcast",
          { event: "PlayerGearChoiceUpdated" },
          ({ payload: playerGearChoice }) => {
            queryClient.setQueryData(
              [
                {
                  scope: "PlayerGearChoice",
                  playerId: playerGearChoice.playerId,
                },
              ],
              playerGearChoice,
            );
          },
        )
        .on("broadcast", { event: "PlayerUpdated" }, ({ payload: player }) => {
          queryClient.setQueryData(
            [{ scope: "Player", playerId: player.id }],
            player,
          );
        })
        .on(
          "broadcast",
          { event: "PlayerStaticUpdated" },
          ({ payload: playerStatic }) => {
            queryClient.invalidateQueries({
              queryKey: [
                { scope: "PlayerList", staticUUID: playerStatic.slug },
              ],
            });
          },
        )
        .on(
          "broadcast",
          { event: "PlayerDeleted" },
          ({ payload: { staticUUID } }) => {
            console.log("player deleted");
            queryClient.invalidateQueries({
              queryKey: [{ scope: "PlayerList", staticUUID }],
            });
          },
        )
        .on(
          "broadcast",
          { event: "PlayerActivated" },
          ({ payload: { staticUUID, player } }) => {
            console.log("player activated");
            queryClient.invalidateQueries({
              queryKey: [{ scope: "PlayerList", staticUUID }],
            });
            queryClient.setQueryData(
              [{ scope: "PlayerList", playerId: player.id }],
              player,
            );
          },
        )
        .subscribe();
      return () => {
        channel.unsubscribe();
      };
    };
  }, [staticUUID, queryClient]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return <>{children}</>;
}
