import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { getOrCreatePlayerGearChoice, getPlayerListForStatic } from "./actions";
import PlayerStaticTableBody from "./PlayerStaticTableBody";

export default async function Page({
  params: { staticUUID },
}: {
  params: { staticUUID: string };
}) {
  const players = await getPlayerListForStatic(staticUUID);
  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryFn: () => players,
      queryKey: [{ scope: "PlayerList", staticUUID }],
    }),
    ...players
      .map((player) => {
        return [
          queryClient.prefetchQuery({
            queryKey: [{ scope: "PlayerGearChoice", playerId: player.id }],
            queryFn: () => getOrCreatePlayerGearChoice(player.id),
          }),
          queryClient.prefetchQuery({
            queryKey: [{ scope: "Player", playerId: player.id }],
            queryFn: () => player,
          }),
        ];
      })
      .flat(),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlayerStaticTableBody staticUUID={staticUUID} />
    </HydrationBoundary>
  );
}
