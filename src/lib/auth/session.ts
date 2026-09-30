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

export function createSessionToken(input: {
  sub: string;
  role: SessionRole;
  email: string;
  name?: string;
}): string {
  if (!sessionSecret()) return "";
  const payload: Session = {
    sub: input.sub,
    role: input.role,
    email: input.email,
    name: input.name || "",
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token?: string | null): Session | null {
  if (!token || !sessionSecret()) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const mac = token.slice(separator + 1);
  const expected = sign(body);
  if (mac.length !== expected.length) return null;

  const macBuffer = Buffer.from(mac);
  const expectedBuffer = Buffer.from(expected);
  if (!crypto.timingSafeEqual(macBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session;
    if (!payload?.sub || !payload?.role || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    if (payload.role !== "CUSTOMER" && payload.role !== "ADMIN" && payload.role !== "SUPPLIER") {
      return null;
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
