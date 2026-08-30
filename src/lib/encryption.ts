import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.BANK_DETAILS_ENCRYPTION_KEY;
  if (!raw) throw new Error("BANK_DETAILS_ENCRYPTION_KEY environment variable is not set");
  const hash = crypto.createHash("sha256").update(raw).digest();
  return hash;
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const result = Buffer.concat([iv, tag, encrypted]);
  return result.toString("base64");
}

export function decrypt(encryptedBase64: string): string {
  const key = getKey();
  const buf = Buffer.from(encryptedBase64, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function maskAccountNumber(accountNumber: string): string {
  const decrypted = accountNumber.length > 30 ? decrypt(accountNumber) : accountNumber;
  if (decrypted.length <= 4) return "****" + decrypted;
  return "*".repeat(decrypted.length - 4) + decrypted.slice(-4);
}
