import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { completeEnrolment } from "@/lib/auth/two-factor";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit";

const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/**
 * Step 2: the account holder proves they can read the code the secret
 * produces, and only then does enrolment take effect. Backup codes come back
 * exactly once, here.
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const rate = rateLimit("two-factor-enable", `${clientIp(request)}:${session.sub}`, MAX_ATTEMPTS, LOCKOUT_DURATION_MS);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { code } = await request.json().catch(() => ({ code: "" }));
    if (typeof code !== "string") {
      return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
    }

    const result = await completeEnrolment(session.sub, code);
    if (!result.ok) {
      return NextResponse.json({ error: "That code is not valid. Check your authenticator app and try again." }, { status: 400 });
    }

    audit("two_factor_enabled", { userId: session.sub, email: session.email });
    return NextResponse.json({ enabled: true, backupCodes: result.backupCodes });
  } catch (error) {
    console.error("[TWO_FACTOR_ENABLE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
