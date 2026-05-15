import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM. Ciphertext format on disk:
//   <iv_hex>:<authtag_hex>:<ciphertext_hex>
// Key comes from EMAIL_TOKEN_ENCRYPTION_KEY (64-char hex = 32 bytes).
// Generate one with: openssl rand -hex 32

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

function getKey(): Buffer {
  const hex = process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "EMAIL_TOKEN_ENCRYPTION_KEY is not set. Generate one with `openssl rand -hex 32`."
    );
  }
  if (hex.length !== 64) {
    throw new Error(
      "EMAIL_TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)."
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptToken(payload: string): string {
  const [ivHex, tagHex, encHex] = payload.split(":");
  if (!ivHex || !tagHex || !encHex) {
    throw new Error("Malformed encrypted token payload.");
  }
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
