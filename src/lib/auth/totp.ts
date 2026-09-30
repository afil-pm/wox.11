import crypto from "crypto";

/**
 * RFC 6238 TOTP (SHA-1, 30s, 6 digits) plus the base32 plumbing authenticator
 * apps expect. Hand-rolled on purpose: the only two npm options here would be
 * pulling a dependency tree into a security-critical path for ~60 lines of
 * HMAC arithmetic.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DIGITS = 6;
const PERIOD_SECONDS = 30;
const WINDOW_STEPS = 1;

/** 20 random bytes -> 32 base32 chars, the standard authenticator secret. */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Buffer | null {
  const clean = input.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  if (!clean || /[^A-Z2-7]/.test(clean)) return null;

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** otpauth:// URL a QR code (or manual-key entry) is built from. */
export function otpauthUri(email: string, secret: string): string {
  const issuer = "WOX.11";
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  if (!key) return "";

  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const digest = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);

  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/**
 * Accepts the current step plus/minus one, which is what every real
 * authenticator needs when the device clock drifts a few seconds. Wider
 * windows would hand an attacker replay room, so this stays at one step.
 */
export function verifyTotp(secret: string, code: string, atSeconds?: number): boolean {
  if (!secret || !/^\d{6}$/.test(code)) return false;

  const now = Math.floor((atSeconds ?? Date.now()) / 1000);
  const counter = Math.floor(now / PERIOD_SECONDS);

  for (let step = -WINDOW_STEPS; step <= WINDOW_STEPS; step += 1) {
    const expected = hotp(secret, counter + step);
    if (expected && constantTimeEquals(expected, code)) return true;
  }
  return false;
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Offline fallback when the authenticator is unavailable. */
const BACKUP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const BACKUP_CODE_COUNT = 10;

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i += 1) {
    const raw = crypto.randomBytes(8);
    let out = "";
    for (const byte of raw) {
      out += BACKUP_ALPHABET[byte % BACKUP_ALPHABET.length];
    }
    codes.push(`${out.slice(0, 4)}-${out.slice(4)}`);
  }
  return codes;
}

/**
 * Backup codes are stored as digests rather than in the clear, so a leaked
 * collection cannot be replayed against the login endpoint directly. The
 * domain separator keeps them from being confused with any other digest in
 * the database.
 */
export function hashBackupCode(code: string): string {
  const normalised = normaliseBackupCode(code);
  if (!normalised) return "";
  return crypto.createHash("sha256").update(`wox-2fa-backup:${normalised}`).digest("hex");
}

export function normaliseBackupCode(code: string): string {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}
