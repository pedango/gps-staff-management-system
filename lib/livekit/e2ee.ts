import crypto from "node:crypto";

/**
 * Deterministic per-conversation E2EE passphrase. Both participants derive the
 * same value, it is only returned to authenticated conversation members, and it
 * is never sent to LiveKit — so LiveKit cannot decrypt the media.
 */
export function deriveE2eeKey(apiSecret: string, room: string): string {
  return crypto.createHmac("sha256", apiSecret).update(`livekit-e2ee:${room}`).digest("base64");
}

/**
 * Fingerprint of an E2EE key. A participant that reports this exact fingerprint
 * has proven possession of the real conversation key (it can't be computed
 * without the key), which is the basis for verified server-side audit records.
 */
export function e2eeKeyFingerprint(key: string): string {
  return crypto.createHash("sha256").update(key).digest("base64");
}
