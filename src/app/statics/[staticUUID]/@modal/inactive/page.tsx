export const dynamice = "force-dynamic";
import { PlayerStatic } from "@prisma/client";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { getInactivePlayersForStatic } from "./actions";
import { InactivePlayers } from "./InactivePlayers";
export default async function Page({
  params: { staticUUID },
}: {
  params: { staticUUID: PlayerStatic["slug"] };
}) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: [{ scope: "PlayerList", staticUUID, active: false }],
    queryFn: () => getInactivePlayersForStatic(staticUUID),
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InactivePlayers staticUUID={staticUUID} />
    </HydrationBoundary>
  );
}
