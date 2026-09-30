import crypto from "crypto";
import { cookies } from "next/headers";
import { getSession, sessionSecret, Session, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";
import Order from "@/lib/models/order";
import SavedBankDetails from "@/lib/models/saved-bank-details";
import RefundRequest from "@/lib/models/refund-request";
import { audit } from "@/lib/security/audit";

/**
 * Customer / visitor identity resolution.
 *
 * Historically the storefront told the API "I am user X" with a plain
 * `x-user-id` header and the server believed it, which meant anyone who learnt
 * another visitor's id (shared device, log leak, XSS, an API that echoed it)
 * could read and edit that account's orders, notifications, refunds and saved
 * bank details.
 *
 * The rules now are:
 *
 *  1. A signed session always wins — the id comes from the token, never from
 *     the client.
 *  2. Otherwise the `wox-visitor` cookie carries `<id>.<HMAC(id)>`. The id may
 *     be known to the attacker; the signature cannot be forged without the
 *     server secret, so possession of the cookie is the proof.
 *  3. With no cookie (first visit, or the server never bound one yet) a
 *     client supplied id is only accepted when it is well formed **and**
 *     unclaimed — no user, order, notification, refund bank record or recovery
 *     message exists for it. A claimed id is rejected instead of silently
 *     adopted, so an attacker cannot take over an existing visitor.
 *
 * The cookie is `HttpOnly`, so script running on the page cannot read it.
 */

export const VISITOR_COOKIE = "wox-visitor";

const VISITOR_ID_PATTERN = /^[a-f0-9]{32}$/;
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type IdentitySource = "session" | "visitor" | "first_visit" | "none";

export interface CustomerIdentity {
  userId: string | null;
  source: IdentitySource;
  reason?: string;
}

function visitorMac(uid: string): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(`wox-visitor:${uid}`).digest("base64url");
}

export function visitorToken(uid: string): string | null {
  const mac = visitorMac(uid);
  return mac ? `${uid}.${mac}` : null;
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyVisitorToken(token: string | undefined): string | null {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const uid = token.slice(0, separator);
  const mac = token.slice(separator + 1);
  if (!VISITOR_ID_PATTERN.test(uid)) return null;

  const expected = visitorMac(uid);
  if (!expected) return null;
  if (!constantTimeEqual(mac, expected)) return null;

  return uid;
}

/**
 * Has this visitor id ever been used for something worth protecting? If it
 * has, it belongs to somebody else and must never be adopted from a header.
 *
 * Deliberately limited to records that carry money or credentials — a
 * notification on its own is not worth locking a legitimate visitor out for.
 */
async function isClaimed(uid: string): Promise<boolean> {
  try {
    await connectMongoDB();

    const probes: Array<Promise<unknown>> = [
      Order.exists({ userId: uid }),
      SavedBankDetails.exists({ userId: uid }),
      RefundRequest.exists({ userId: uid }),
    ];

    // `_id` is an ObjectId: guard against CastErrors on odd values.
    if (/^[a-f0-9]{24}$/i.test(uid)) {
      probes.push(User.exists({ _id: uid }));
    }

    const results = await Promise.all(probes);
    return results.some((result) => result !== null && result !== undefined);
  } catch {
    // If the registry cannot be read we fail closed: an unknown id is treated
    // as claimed so a database blip can never open a takeover hole.
    return true;
  }
}

/**
 * Resolves the identity a request is really allowed to act as.
 *
 * `requestedUserId` is whatever the caller claimed (`x-user-id`, body field,
 * query param). It is only ever used as a *hint*: the returned id is the one
 * the server is willing to authorise, or `null` when nothing can be trusted.
 */
export async function resolveCustomerIdentity(
  request: { headers: { get(name: string): string | null } },
  requestedUserId?: string | null
): Promise<CustomerIdentity> {
  const requested = (requestedUserId || "").trim();
  const store = await cookies();

  // Header/Authorization first (API clients), then the HttpOnly login cookie
  // browsers carry automatically.
  const session: Session | null =
    getSession(request) ?? verifySessionToken(store.get(SESSION_COOKIE)?.value);

  if (session) {
    if (session.role === "ADMIN") {
      // The admin panel legitimately acts on the pseudo admin identity and on
      // behalf of customers when reviewing their data.
      return { userId: requested || session.sub, source: "session" };
    }
    return { userId: session.sub, source: "session" };
  }

  const cookieUid = verifyVisitorToken(store.get(VISITOR_COOKIE)?.value);

  if (cookieUid) {
    if (requested && requested !== cookieUid) {
      // The signed cookie is the stronger proof, so it wins. This also keeps
      // working when localStorage was cleared and the client generated a fresh
      // id, while making a spoofed header harmless (it is simply ignored).
      audit("customer_identity_rejected", {
        reason: "cookie_mismatch",
        requested,
        bound: cookieUid,
      });
      return { userId: cookieUid, source: "visitor", reason: "cookie_mismatch" };
    }
    return { userId: cookieUid, source: "visitor" };
  }

  if (!requested) return { userId: null, source: "none" };

  if (!VISITOR_ID_PATTERN.test(requested)) {
    audit("customer_identity_rejected", { reason: "malformed_id", requested });
    return { userId: null, source: "none", reason: "malformed_id" };
  }

  if (await isClaimed(requested)) {
    audit("customer_identity_rejected", { reason: "id_already_claimed", userId: requested });
    return { userId: null, source: "none", reason: "id_already_claimed" };
  }

  try {
    const token = visitorToken(requested);
    if (token) {
      store.set(VISITOR_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: VISITOR_COOKIE_MAX_AGE,
      });
    }
  } catch {
    // Cookie write failures only cost the binding, never the request.
  }

  return { userId: requested, source: "first_visit" };
}

/** Convenience wrapper for routes that only need the authorised id. */
export async function customerUserId(
  request: { headers: { get(name: string): string | null } },
  requestedUserId?: string | null
): Promise<string | null> {
  const identity = await resolveCustomerIdentity(request, requestedUserId);
  return identity.userId;
}
