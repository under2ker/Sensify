/**
 * Шифрование полей Groq/Gemini в БД (Phase 0 TZ Production).
 * AES-256-GCM; префикс s1: отличает ciphertext от legacy plaintext.
 * Без ENCRYPTION_KEY значения пишутся в БД как раньше (plain) — для локальной разработки.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "s1";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const KEY_LEN = 32;

function rawKey(): Buffer | null {
  const env = process.env.ENCRYPTION_KEY?.trim();
  if (!env) return null;
  if (/^[0-9a-fA-F]{64}$/.test(env)) return Buffer.from(env, "hex");
  const b64 = Buffer.from(env, "base64");
  if (b64.length === KEY_LEN) return b64;
  return null;
}

/** true если задан валидный 32-byte ключ (hex64 или base64 → 32 bytes) */
export function isUserApiKeyEncryptionEnabled(): boolean {
  return rawKey() !== null;
}

/** Сохранить в БД: зашифровать при наличии ENCRYPTION_KEY */
export function sealUserApiKey(plain: string): string {
  const key = rawKey();
  if (!key) return plain;
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv, { authTagLength: 16 });
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

/** Прочитать из БД: расшифровать s1:… или вернуть как есть (legacy) */
export function openUserApiKey(stored: string | null | undefined): string | null {
  if (stored == null || stored === "") return null;
  if (!stored.startsWith(`${PREFIX}:`)) return stored;
  const key = rawKey();
  if (!key) {
    console.warn(
      "[user-api-keys] В БД зашифрованный ключ, но ENCRYPTION_KEY не задан — ключ недоступен"
    );
    return null;
  }
  const parts = stored.split(":");
  if (parts.length !== 4) return null;
  const [, ivB64, tagB64, dataB64] = parts;
  try {
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const data = Buffer.from(dataB64, "base64url");
    const decipher = createDecipheriv(ALGO, key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
