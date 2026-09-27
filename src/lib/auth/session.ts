import crypto from "crypto";

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
 * Session signing secret. AUTH_SECRET is preferred, ADMIN_PASSWORD keeps the
 * panel usable in environments that only define the legacy credentials.
 */
export function sessionSecret(): string {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
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
}

/**
 * Reads the session from `Authorization: Bearer …` or the `x-session-token`
 * header (the frontend uses the latter, matching the existing header style).
 */
export function getSession(request: SessionRequest): Session | null {
  const authorization = request.headers.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return verifySessionToken(authorization.slice(7).trim());
  }
  return verifySessionToken(request.headers.get("x-session-token"));
}
