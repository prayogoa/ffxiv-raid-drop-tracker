import { createClient } from "@supabase/supabase-js";

export const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

export async function sendBroadcastMessage(
  channelName: string,
  event: string,
  payload: any,
) {
  const channel = client.channel(channelName);
  await channel.send({ type: "broadcast", event, payload });
  client.removeChannel(channel);
}
