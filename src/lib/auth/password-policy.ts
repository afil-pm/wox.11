import crypto from "crypto";

/**
 * Password rules.
 *
 * Composition puzzles ("one uppercase, one symbol, one emoji") push people
 * towards `Password1!`, which is guessable and reused; the guidelines that
 * matter are length, not appearing in known breach corpora, and not being one
 * of the passwords attackers try first. So this is: length, a small blocklist,
 * and a Have-I-Been-Pwned k-anonymity lookup.
 */

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

/** passwords that show up at the top of every credential-stuffing list. */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "p@ssw0rd",
  "12345678",
  "123456789",
  "1234567890",
  "87654321",
  "qwerty",
  "qwerty123",
  "qwertyuiop",
  "qazwsx",
  "zaq12wsx",
  "asdfghjkl",
  "letmein",
  "welcome",
  "welcome1",
  "welcome123",
  "admin",
  "admin123",
  "administrator",
  "root",
  "toor",
  "master",
  "shadow",
  "secret",
  "changeme",
  "iloveyou",
  "monkey",
  "dragon",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "trustno1",
  "abc123",
  "abcd1234",
  "abcdefgh",
  "test1234",
  "testtest",
  "hello123",
  "freedom",
  "whatever",
  "superman",
  "batman",
  "starwars",
  "computer",
  "michelle",
  "charlie",
  "jessica",
  "summer2024",
  "winter2024",
  "00000000",
  "11111111",
]);

export interface PasswordCheck {
  ok: boolean;
  error?: string;
}

/** Cheap local rules. Returns `null` when the password is acceptable. */
export function checkPasswordStrength(password: unknown): PasswordCheck {
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, error: "Password is required" };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters` };
  }
  if (COMMON_PASSWORDS.has(password.trim().toLowerCase())) {
    return { ok: false, error: "That password is too common. Please choose something less predictable." };
  }
  return { ok: true };
}

/**
 * Has this password been seen in a breach?
 *
 * Uses the HIBP range API (k-anonymity): only the first 5 characters of the
 * SHA-1 hash leave the server, so the password itself and its full hash never
 * do. `null` means "could not check" (offline, slow, API down) — callers fail
 * open so a third-party outage can never block sign-ups or password resets.
 */
export async function passwordAppearsInBreach(password: string): Promise<boolean | null> {
  try {
    const digest = crypto.createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
    const prefix = digest.slice(0, 5);
    const suffix = digest.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const body = await res.text();
    for (const line of body.split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator <= 0) continue;
      if (line.slice(0, separator).trim() === suffix) {
        return Number.parseInt(line.slice(separator + 1), 10) > 0;
      }
    }
    return false;
  } catch {
    return null;
  }
}

/** Local rules + breach check, in that order. */
export async function validateNewPassword(password: unknown): Promise<PasswordCheck> {
  const strength = checkPasswordStrength(password);
  if (!strength.ok) return strength;

  const breached = await passwordAppearsInBreach(password as string);
  if (breached === true) {
    return {
      ok: false,
      error: "That password has appeared in a data breach. Please choose a different one.",
    };
  }
  return { ok: true };
}
