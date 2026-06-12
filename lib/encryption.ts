import crypto from "crypto";
import { env } from "./env";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer | null {
  if (!env.ENCRYPTION_KEY) return null;
  return crypto.createHash("sha256").update(env.ENCRYPTION_KEY).digest();
}

export function encryptSecret(value: string): string {
  const key = getKey();
  if (!key) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key as unknown as crypto.CipherKey,
    iv as unknown as crypto.BinaryLike
  );
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ] as unknown as Uint8Array[]);
  const tag = cipher.getAuthTag();

  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(value: string): string {
  if (!value.startsWith("enc:")) return value;

  const key = getKey();
  if (!key) return value;

  const [, ivHex, tagHex, dataHex] = value.split(":");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key as unknown as crypto.CipherKey,
    Buffer.from(ivHex, "hex") as unknown as crypto.BinaryLike
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex") as unknown as NodeJS.ArrayBufferView);
  const data = Buffer.from(dataHex, "hex");
  const decrypted = Buffer.concat([
    decipher.update(data as unknown as NodeJS.ArrayBufferView),
    decipher.final(),
  ] as unknown as Uint8Array[]);

  return decrypted.toString("utf8");
}

export function generateShareableId(): string {
  return crypto.randomUUID();
}
