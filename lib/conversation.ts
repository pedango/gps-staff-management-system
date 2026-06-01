export function getConversationId(adminIdA: string, adminIdB: string): string {
  return [adminIdA, adminIdB].sort((a, b) => a.localeCompare(b)).join("-");
}

/**
 * Resolves the peer admin id from a conversation id `min(a,b)-max(a,b)` without
 * splitting on `-` (Prisma `cuid()` values must not be parsed as hyphen-delimited tokens).
 */
export function getPeerId(conversationId: string, selfId: string): string | null {
  const prefix = `${selfId}-`;
  const suffix = `-${selfId}`;
  if (conversationId.startsWith(prefix)) {
    return conversationId.slice(prefix.length);
  }
  if (conversationId.endsWith(suffix)) {
    return conversationId.slice(0, -suffix.length);
  }
  return null;
}
