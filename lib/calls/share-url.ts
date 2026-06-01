export function getCallSharePath(sessionId: string): string {
  return `/call/${sessionId}`;
}

export function getCallShareUrl(sessionId: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : process.env.NEXTAUTH_URL ?? "");
  return `${base.replace(/\/$/, "")}${getCallSharePath(sessionId)}`;
}
