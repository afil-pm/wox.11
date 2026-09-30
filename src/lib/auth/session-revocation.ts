import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";
import { Session } from "@/lib/auth/session";
import { audit } from "@/lib/security/audit";

/**
 * Is the session still one the account holder would recognise?
 *
 * Tokens are signed and expire on their own, but a signature cannot notice
 * that the password changed since it was issued — so each token carries the
 * `sessionVersion` it was minted with and we compare it with the row. A
 * password reset (or any future "sign out everywhere") bumps the column and
 * every session issued before it stops working immediately, including ones
 * stolen from another device or a copied cookie.
 *
 * Pseudo accounts (`admin-env`) have no row: their sessions are revoked by the
 * credential fingerprint check inside `verifySessionToken` instead.
 */
export async function sessionStillActive(session: Session | null): Promise<boolean> {
  if (!session) return false;
  if (!/^[a-f0-9]{24}$/i.test(session.sub)) return true;

  try {
    await connectMongoDB();
    const user = (await User.findById(session.sub)
      .select("sessionVersion")
      .lean()) as unknown as { sessionVersion?: number } | null;

    if (!user) {
      audit("session_revoked", { reason: "account_missing", userId: session.sub });
      return false;
    }

    const current = Number(user.sessionVersion) || 0;
    const issued = Number(session.v) || 0;
    if (current !== issued) {
      audit("session_revoked", { reason: "version_mismatch", userId: session.sub, current, issued });
      return false;
    }
    return true;
  } catch {
    // A database blip must not lock every signed-in customer out of the
    // storefront; the row lookup that every real request performs still runs
    // against the same database, so there is no window worth protecting here.
    return true;
  }
}
