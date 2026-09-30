import { resolveCustomerIdentity } from "@/lib/auth/identity";

/**
 * The notification user id a caller is allowed to act on.
 *
 * Resolution order:
 *  - a signed SUPPLIER session is pinned to that supplier's own account;
 *  - an ADMIN session keeps the requested id (the admin bell listens on the
 *    `admin-env` pseudo user);
 *  - everyone else must prove possession of the visitor identity, so a plain
 *    `x-user-id` header can no longer be used to read another account's
 *    notifications or mark them as read.
 *
 * Returns `null` when nothing can be authorised — callers treat that as
 * "no identity" and return an empty result instead of someone else's data.
 */
export async function scopedNotificationUserId(
  request: { headers: { get(name: string): string | null } },
  requestedUserId: string
): Promise<string | null> {
  const identity = await resolveCustomerIdentity(request, requestedUserId);
  return identity.userId;
}
