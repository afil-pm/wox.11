import crypto from "crypto";
import fs from "fs";
import path from "path";

export type SessionRole = "CUSTOMER" | "ADMIN" | "SUPPLIER";

export interface Session {
  sub: string;
  role: SessionRole;
  email: string;
  name: string;
  exp: number;
  /**
   * `User.sessionVersion` at the time the token was minted. Bumping the
   * column (password reset, "sign out everywhere") invalidates every token
   * issued before it, which is what makes a stolen session die with the
   * password it was stolen with.
   */
  v?: number;
  /**
   * Fingerprint of the admin credentials the token was minted under. The
   * admin account has no user row to hold a version, so the credential
   * itself is the revocation lever: rotate `ADMIN_PASSWORD` and every
   * outstanding admin session stops verifying.
   */
  ap?: string;
  /**
   * Purpose marker. A signed token with `p: "2fa"` is a short-lived
   * "password accepted, waiting for the code" challenge — never a session.
   * Both verifiers compare it, so a challenge can never be replayed as a
   * login and a session can never be replayed as an answer.
   */
  p?: string;
  /**
   * Challenge id. Consumed (once) when the code is accepted, so a token that
   * was copied out of a half-finished login cannot be answered twice.
   */
  j?: string;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Values that ship in docs / sample env files. Signing a session with one of
 * these means anyone who has ever seen the sample can mint an admin token, so
 * they are treated exactly like "not configured".
 */
const PLACEHOLDER_SECRETS = [
  "change-me",
  "change-me-to-a-real-secret",
  "changeme",
  "your-auth-secret",
  "your-secret-key",
  "secret",
  "password",
  "admin",
];

const MIN_SECRET_LENGTH = 16;

function isUsableSecret(value: string): boolean {
  const secret = value.trim();
  if (secret.length < MIN_SECRET_LENGTH) return false;
  return !PLACEHOLDER_SECRETS.includes(secret.toLowerCase());
}

/**
 * Session signing secret.
 *
 * Resolution order:
 *  1. `AUTH_SECRET` — the dedicated key, when it is not a sample value.
 *  2. A locally generated key kept in `.wox-session-secret` (git ignored).
 *     Created on first use so a fresh checkout still gets a strong, random
 *     signing key instead of falling back to a documented default.
 *  3. `ADMIN_PASSWORD` — legacy environments that only define credentials.
 *     Used when the filesystem is read-only (serverless) or unavailable.
 *
 * Placeholder values (`change-me-to-a-real-secret`, short strings, …) are
 * rejected so a misconfigured deploy fails closed instead of handing out
 * forgeable admin tokens.
 */
const GENERATED_SECRET_FILE = ".wox-session-secret";

let generatedSecretCache: string | null = null;

function generatedSecret(): string {
  if (generatedSecretCache) return generatedSecretCache;
  try {
    const file = path.join(process.cwd(), GENERATED_SECRET_FILE);
    if (fs.existsSync(file)) {
      const value = fs.readFileSync(file, "utf8").trim();
      if (value.length >= MIN_SECRET_LENGTH * 2) {
        generatedSecretCache = value;
        return value;
      }
    }
    const value = crypto.randomBytes(48).toString("hex");
    fs.writeFileSync(file, `${value}\n`, { encoding: "utf8", mode: 0o600 });
    generatedSecretCache = value;
    return value;
  } catch {
    return "";
  }
}

export function sessionSecret(): string {
  const authSecret = (process.env.AUTH_SECRET || "").trim();
  if (isUsableSecret(authSecret)) return authSecret;

  const localSecret = generatedSecret();
  if (localSecret) return localSecret;

  const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();
  if (isUsableSecret(adminPassword)) return adminPassword;

  return "";
}

function sign(body: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(body).digest("base64url");
}

/**
 * Stable, non-reversible tag over the admin credential. HMAC'd with the
 * session secret so the token payload (base64, readable by anyone holding it)
 * never exposes anything an offline attacker could test password guesses
 * against.
 */
function adminCredentialFingerprint(): string {
  const secret = sessionSecret();
  if (!secret) return "";
  const material = `admin-fp:${process.env.ADMIN_EMAIL || ""}:${process.env.ADMIN_PASSWORD || ""}`;
  return crypto.createHmac("sha256", secret).update(material).digest("hex").slice(0, 32);
}

export function createSessionToken(input: {
  sub: string;
  role: SessionRole;
  email: string;
  name?: string;
  version?: number;
}): string {
  if (!sessionSecret()) return "";
  const payload: Session = {
    sub: input.sub,
    role: input.role,
    email: input.email,
    name: input.name || "",
    exp: Date.now() + SESSION_TTL_MS,
    ...(typeof input.version === "number" ? { v: input.version } : {}),
    ...(input.role === "ADMIN" ? { ap: adminCredentialFingerprint() } : {}),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token?: string | null): Session | null {
  return verifySignedToken(token, undefined);
}

/** Five minutes is long enough to read a code off a phone, short enough that a
 * half-finished login left on screen is not a standing credential. */
export const TWO_FACTOR_CHALLENGE_TTL_MS = 5 * 60 * 1000;

/**
 * Issued after the password (or admin credential) checks out but before the
 * second factor does. Carries everything the real session would, so completing
 * the challenge does not need to re-read the account.
 */
export function createTwoFactorChallenge(input: {
  sub: string;
  role: SessionRole;
  email: string;
  name?: string;
  version?: number;
}): string {
  if (!sessionSecret()) return "";
  const payload: Session = {
    sub: input.sub,
    role: input.role,
    email: input.email,
    name: input.name || "",
    exp: Date.now() + TWO_FACTOR_CHALLENGE_TTL_MS,
    p: "2fa",
    j: crypto.randomBytes(8).toString("hex"),
    ...(typeof input.version === "number" ? { v: input.version } : {}),
    ...(input.role === "ADMIN" ? { ap: adminCredentialFingerprint() } : {}),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyTwoFactorChallenge(token?: string | null): Session | null {
  return verifySignedToken(token, "2fa");
}

function verifySignedToken(token: string | null | undefined, purpose: string | undefined): Session | null {
  if (!token || !sessionSecret()) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const mac = token.slice(separator + 1);
  const expectedMac = sign(body);
  if (mac.length !== expectedMac.length) return null;

  const macBuffer = Buffer.from(mac);
  const expectedBuffer = Buffer.from(expectedMac);
  if (!crypto.timingSafeEqual(macBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session;
    if (!payload?.sub || !payload?.role || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    if (payload.role !== "CUSTOMER" && payload.role !== "ADMIN" && payload.role !== "SUPPLIER") {
      return null;
    }
    // Purpose must match exactly: a pending-challenge token is not a session,
    // and a session is not an answer to a challenge.
    if ((payload.p || undefined) !== purpose) return null;
    // Admin sessions are only valid while the credential they were minted
    // under is still the current one — rotating ADMIN_PASSWORD logs every
    // outstanding admin session out. Tokens from before this rule existed
    // carry no fingerprint and are rejected (they simply have to sign in
    // again).
    if (payload.role === "ADMIN") {
      const expectedFingerprint = adminCredentialFingerprint();
      const actual = payload.ap || "";
      if (!expectedFingerprint || actual.length !== expectedFingerprint.length) return null;
      const actualBuffer = Buffer.from(actual);
      const expectedBufferFingerprint = Buffer.from(expectedFingerprint);
      if (!crypto.timingSafeEqual(actualBuffer, expectedBufferFingerprint)) return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export interface SessionRequest {
  headers: { get(name: string): string | null };
  cookies?: { get(name: string): { value?: string; name?: string } | undefined | null };
}

/**
 * Name of the HttpOnly session cookie. The same token is still returned in the
 * login body for API clients, but browser requests pick it up automatically,
 * so no client code has to copy a credential into `localStorage` (which any
 * injected script can read).
 */
export const SESSION_COOKIE = "wox-session";

export const SESSION_COOKIE_MAX_AGE = Math.floor(SESSION_TTL_MS / 1000);

export function sessionCookieOptions(): {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  };
}

/**
 * Reads the session from `Authorization: Bearer …`, the `x-session-token`
 * header (the admin/supplier panels use it) or the `wox-session` cookie that
 * browser clients get on login.
 */
export function getSession(request: SessionRequest): Session | null {
  const authorization = request.headers.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return verifySessionToken(authorization.slice(7).trim());
  }

  const headerToken = request.headers.get("x-session-token");
  if (headerToken) return verifySessionToken(headerToken);

  const cookieToken = request.cookies?.get(SESSION_COOKIE)?.value;
  if (cookieToken) return verifySessionToken(cookieToken);

  return null;
}
