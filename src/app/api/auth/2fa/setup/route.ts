import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth/session";
import { beginEnrolment } from "@/lib/auth/two-factor";
import { otpauthUri } from "@/lib/auth/totp";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const MAX_SETUP_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

/**
 * Step 1 of enrolment: mint (or replace) the secret and hand back what the
 * authenticator app needs. Nothing is enforced until `/enable` confirms a code
 * the user could actually produce from it, so a mistyped QR never locks
 * anyone out.
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const rate = rateLimit("two-factor-setup", `${clientIp(request)}:${session.sub}`, MAX_SETUP_ATTEMPTS, LOCKOUT_DURATION_MS);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const state = await beginEnrolment(session.sub);
    const otpauthUrl = otpauthUri(session.email, state.secret);
    // Rendered here rather than in the browser: the `qrcode` package is
    // Node-targeted, and the secret only ever has to travel to the account
    // holder who just asked for it.
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 260 });

    return NextResponse.json({
      secret: state.secret,
      otpauthUrl,
      qrDataUrl,
      enabled: false,
    });
  } catch (error) {
    console.error("[TWO_FACTOR_SETUP_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
