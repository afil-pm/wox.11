import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionToken,
  sessionCookieOptions,
  verifyTwoFactorChallenge,
} from "@/lib/auth/session";
import { consumeChallenge, verifySecondFactor } from "@/lib/auth/two-factor";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit";

const MAX_IP_ATTEMPTS = 10;
const MAX_ACCOUNT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/**
 * Completes a login whose password already checked out. The caller holds a
 * five-minute challenge token rather than a session, so nothing here can be
 * used as a login until the code matches — and only then is the real
 * `wox-session` cookie minted.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    if (!rateLimit("two-factor-ip", ip, MAX_IP_ATTEMPTS, LOCKOUT_DURATION_MS).ok) {
      audit("login_rate_limited", { route: "/api/auth/2fa/verify", ip });
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(LOCKOUT_DURATION_MS / 1000)) } }
      );
    }

    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const twoFactorToken = typeof body.twoFactorToken === "string" ? body.twoFactorToken : "";
    const code = typeof body.code === "string" ? body.code : "";

    const challenge = verifyTwoFactorChallenge(twoFactorToken);
    if (!challenge) {
      return NextResponse.json(
        { error: "Your sign-in attempt expired. Please sign in again." },
        { status: 401 }
      );
    }

    if (!rateLimit("two-factor-account", challenge.sub, MAX_ACCOUNT_ATTEMPTS, LOCKOUT_DURATION_MS).ok) {
      audit("login_rate_limited", { route: "/api/auth/2fa/verify", ip, userId: challenge.sub });
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const result = await verifySecondFactor(challenge.sub, code);
    if (!result.ok) {
      audit("two_factor_failed", { userId: challenge.sub, ip, reason: result.reason });
      // Same body whether the code was wrong or the account has no enrolment
      // record, so the endpoint cannot be used to map who has 2FA turned on.
      return NextResponse.json({ error: "Invalid authentication code." }, { status: 401 });
    }

    // The code was right — now spend the challenge so the same token cannot
    // be answered a second time from somewhere else.
    if (!(await consumeChallenge(challenge.sub, challenge.j))) {
      audit("two_factor_failed", { userId: challenge.sub, ip, reason: "challenge_replayed" });
      return NextResponse.json(
        { error: "Your sign-in attempt expired. Please sign in again." },
        { status: 401 }
      );
    }

    const token = createSessionToken({
      sub: challenge.sub,
      role: challenge.role,
      email: challenge.email,
      name: challenge.name,
      version: challenge.v,
    });
    if (!token) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const store = await cookies();
    store.set("wox-session", token, sessionCookieOptions());
    audit("login_success", { userId: challenge.sub, email: challenge.email, ip, twoFactor: true });

    const user: Record<string, unknown> = {
      id: challenge.sub,
      name: challenge.name,
      email: challenge.email,
      role: challenge.role,
      token,
    };

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("[TWO_FACTOR_VERIFY_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
