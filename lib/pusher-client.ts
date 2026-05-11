import PusherClient from "pusher-js";

export function createPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;
  return new PusherClient(key, { cluster, channelAuthorization: { transport: "ajax" } });
}
