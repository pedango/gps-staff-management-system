import Pusher from "pusher";

const configured =
  Boolean(process.env.PUSHER_APP_ID) &&
  Boolean(process.env.PUSHER_KEY) &&
  Boolean(process.env.PUSHER_SECRET) &&
  Boolean(process.env.PUSHER_CLUSTER);

export const pusherServer: Pusher | null = configured
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

export function isPusherConfigured(): boolean {
  return Boolean(pusherServer);
}
