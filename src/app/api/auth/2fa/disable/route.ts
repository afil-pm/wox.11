import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { disableTwoFactor, verifySecondFactor } from "@/lib/auth/two-factor";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit";

const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/**
 * Turning the second factor off still costs a second factor — otherwise the
 * first stolen session (or an unlocked laptop) quietly removes the protection
 * for every future one.
 */
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const rate = rateLimit("two-factor-disable", `${clientIp(request)}:${session.sub}`, MAX_ATTEMPTS, LOCKOUT_DURATION_MS);
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

    const result = await verifySecondFactor(session.sub, code);
    if (!result.ok) {
      return NextResponse.json({ error: "That code is not valid." }, { status: 400 });
    }

    await disableTwoFactor(session.sub);
    audit("two_factor_disabled", { userId: session.sub, email: session.email });
    return NextResponse.json({ enabled: false });
  } catch (error) {
    console.error("[TWO_FACTOR_DISABLE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
