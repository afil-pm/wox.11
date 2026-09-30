import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sessionStillActive } from "@/lib/auth/session-revocation";

export const dynamic = "force-dynamic";

/**
 * Who the HttpOnly session cookie says we are.
 *
 * The admin panel uses this to tell "your session is gone" (401/403 from an
 * API → come back to the login screen) apart from "you are signed in but not
 * allowed here" (403 from the API → show the error instead of logging you
 * out). It never returns the token, the email or anything else sensitive.
 */
export async function GET(request: NextRequest) {
  const session = getSession(request);
  // A signature alone is not enough: the account may have changed its
  // password (or had the admin credential rotated) since this token was
  // minted, in which case it counts as signed out.
  const authenticated = await sessionStillActive(session);
  return NextResponse.json(
    { authenticated, role: authenticated ? session?.role ?? null : null },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    }
  );
}
