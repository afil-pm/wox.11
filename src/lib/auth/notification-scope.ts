import { getSession, SessionRequest } from "@/lib/auth/session";

/**
 * The notification user id a caller is allowed to act on.
 *
 * A signed SUPPLIER session is always pinned to the supplier's own account,
 * no matter what the client claims in `x-user-id` or the request body — that
 * is what stops one supplier from reading, marking or subscribing another
 * supplier's notifications through the shared endpoints. Callers without a
 * supplier session keep the existing header based behaviour the storefront
 * bell (customers, anonymous visitors, the admin pseudo user) relies on.
 */
export function scopedNotificationUserId(
  request: SessionRequest,
  requestedUserId: string
): string {
  const session = getSession(request);
  if (session?.role === "SUPPLIER") return session.sub;
  return requestedUserId;
}
