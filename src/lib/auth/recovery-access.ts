import crypto from "crypto";
import { customerUserId } from "@/lib/auth/identity";

/**
 * Authorisation for the manual account-recovery flow.
 *
 * `GET /api/messages/status` used to hand back the admin's reply — which
 * contains the recovery key that resets the password — to anyone who could
 * spell the victim's email address. That is a straight account takeover, so
 * every read/write of an account-recovery message now needs one of:
 *
 *   * `x-recovery-token`: the one-time token generated when the request was
 *     sent (stored hashed on the message, shown once to the requester), or
 *   * a proven customer identity that matches `senderUserId` — a signed
 *     session or the bound `wox-visitor` cookie, never a bare header.
 *
 * Returns the Mongo filter fragment to AND into the query, or `null` when the
 * caller has proved nothing at all.
 */
export function hashRecoveryToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;
const MAX_TOKENS = 10;

function providedTokens(headers: { get(name: string): string | null }): string[] {
  const raw = (headers.get("x-recovery-token") || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((token) => token.trim())
    .filter((token) => TOKEN_PATTERN.test(token))
    .slice(0, MAX_TOKENS);
}

export async function recoveryAccessFilter(request: {
  headers: { get(name: string): string | null };
}): Promise<Record<string, unknown> | null> {
  const identity = await customerUserId(request, request.headers.get("x-user-id"));
  const hashes = providedTokens(request.headers).map(hashRecoveryToken);

  const clauses: Record<string, unknown>[] = [];

  if (hashes.length === 1) {
    clauses.push({ lookupTokenHash: hashes[0] });
  } else if (hashes.length > 1) {
    clauses.push({ lookupTokenHash: { $in: hashes } });
  }
  if (identity) {
    clauses.push({ senderUserId: identity });
  }

  if (clauses.length === 0) return null;
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

/** Same check, but against an already loaded message document. */
export async function ownsRecoveryMessage(
  request: { headers: { get(name: string): string | null } },
  message: { lookupTokenHash?: string; senderUserId?: string }
): Promise<boolean> {
  const tokens = providedTokens(request.headers);
  if (tokens.length > 0 && message.lookupTokenHash) {
    const stored = Buffer.from(message.lookupTokenHash);
    const matched = tokens.some((token) => {
      const provided = Buffer.from(hashRecoveryToken(token));
      return provided.length === stored.length && crypto.timingSafeEqual(provided, stored);
    });
    if (matched) return true;
  }

  const identity = await customerUserId(request, request.headers.get("x-user-id"));
  return !!identity && !!message.senderUserId && identity === message.senderUserId;
}
