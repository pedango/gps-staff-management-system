import crypto from "node:crypto";

/**
 * ECIES (Elliptic Curve Integrated Encryption Scheme) for message text at rest.
 *
 * Scheme:
 *   - Curve: NIST P-256 (prime256v1)
 *   - Key agreement: ephemeral-static ECDH against the server EC key pair
 *   - KDF: HKDF-SHA256 (salt = ephemeral public key)
 *   - Cipher: AES-256-GCM (authenticated) with a random 12-byte IV
 *
 * Each ciphertext is self-contained: it carries a fresh ephemeral public key, so
 * the same plaintext encrypts to different blobs every time. The database only
 * ever stores the serialized ciphertext; plaintext exists only in the app layer.
 */

const CURVE = "prime256v1";
const PREFIX = "ECIES1.";
const INFO = Buffer.from("gps-pms/message-text");

// Byte layout of the binary payload (before base64):
// [ ephemeralPublicKey(65) | iv(12) | authTag(16) | ciphertext(...) ]
const EPH_PUB_LEN = 65; // uncompressed P-256 point
const IV_LEN = 12;
const TAG_LEN = 16;

function getServerPrivateKey(): Buffer {
  const b64 = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!b64) {
    throw new Error("MESSAGE_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("MESSAGE_ENCRYPTION_KEY must be a base64-encoded 32-byte value");
  }
  return key;
}

function getServerPublicKey(): Buffer {
  const ecdh = crypto.createECDH(CURVE);
  ecdh.setPrivateKey(getServerPrivateKey());
  return ecdh.getPublicKey();
}

function deriveKey(sharedSecret: Buffer, salt: Buffer): Buffer {
  return Buffer.from(crypto.hkdfSync("sha256", sharedSecret, salt, INFO, 32));
}

/** True if a stored value is an ECIES ciphertext produced by this module. */
export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

/** Encrypts UTF-8 plaintext into a serialized ECIES ciphertext string. */
export function encryptText(plaintext: string): string {
  const ephemeral = crypto.createECDH(CURVE);
  const ephemeralPublicKey = ephemeral.generateKeys();
  const sharedSecret = ephemeral.computeSecret(getServerPublicKey());
  const key = deriveKey(sharedSecret, ephemeralPublicKey);

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(INFO);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([ephemeralPublicKey, iv, authTag, ciphertext]);
  return PREFIX + payload.toString("base64");
}

/** Decrypts a serialized ECIES ciphertext. Non-encrypted values are returned unchanged. */
export function decryptText(value: string): string {
  if (!isEncrypted(value)) {
    return value;
  }
  const payload = Buffer.from(value.slice(PREFIX.length), "base64");
  const ephemeralPublicKey = payload.subarray(0, EPH_PUB_LEN);
  const iv = payload.subarray(EPH_PUB_LEN, EPH_PUB_LEN + IV_LEN);
  const authTag = payload.subarray(EPH_PUB_LEN + IV_LEN, EPH_PUB_LEN + IV_LEN + TAG_LEN);
  const ciphertext = payload.subarray(EPH_PUB_LEN + IV_LEN + TAG_LEN);

  const ecdh = crypto.createECDH(CURVE);
  ecdh.setPrivateKey(getServerPrivateKey());
  const sharedSecret = ecdh.computeSecret(ephemeralPublicKey);
  const key = deriveKey(sharedSecret, ephemeralPublicKey);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(INFO);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Encrypts a nullable field; null/empty passes through untouched. */
export function encryptNullable(value: string | null | undefined): string | null {
  if (value == null || value === "") {
    return value ?? null;
  }
  return encryptText(value);
}

/** Decrypts a nullable field; corrupt or legacy plaintext is returned as-is. */
export function decryptNullable(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  try {
    return decryptText(value);
  } catch {
    return value;
  }
}
