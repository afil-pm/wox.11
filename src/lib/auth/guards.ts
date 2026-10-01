import { getSession, Session } from "@/lib/auth/session";

export interface AuthedRequest {
  headers: { get(name: string): string | null };
}

/**
 * Admin access. Server side only: a valid, unexpired ADMIN session token is
 * required. There is deliberately no header based fallback — trusting
 * `x-admin-email` would let anyone who knows the admin email call admin APIs.
 */
export function getAdminSession(request: AuthedRequest): Session | null {
  const session = getSession(request);
  if (session && session.role === "ADMIN") return session;
  return null;
}

export function isAdmin(request: AuthedRequest): boolean {
  return getAdminSession(request) !== null;
}

/** Admin identity for audit fields — always the session, never a raw header. */
export function getAdminEmail(request: AuthedRequest): string {
  return getAdminSession(request)?.email || "";
}
