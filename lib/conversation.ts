export function getConversationId(adminIdA: string, adminIdB: string): string {
  return [adminIdA, adminIdB].sort().join("-");
}

export function parseConversationPeers(conversationId: string): [string, string] | null {
  const parts = conversationId.split("-");
  if (parts.length !== 2) return null;
  const [a, b] = parts as [string, string];
  if (!a || !b) return null;
  return [a, b];
}

export function getPeerId(conversationId: string, selfId: string): string | null {
  const peers = parseConversationPeers(conversationId);
  if (!peers) return null;
  const [x, y] = peers;
  if (x === selfId) return y;
  if (y === selfId) return x;
  return null;
}
