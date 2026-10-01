import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";
import { createSessionToken, createTwoFactorChallenge, sessionCookieOptions } from "@/lib/auth/session";
import { loadTwoFactor } from "@/lib/auth/two-factor";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit";

const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const MAX_ACCOUNT_ATTEMPTS = 5;

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    if (!rateLimit("login-ip", ip, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MS).ok) {
      audit("login_rate_limited", { route: "/api/auth/login", ip });
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(LOCKOUT_DURATION_MS / 1000)) } }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalisedEmail = email.trim().toLowerCase();

    // Per account budget as well: an attacker rotating source IPs still hits a
    // wall, and responses stay identical for unknown and known accounts.
    if (!rateLimit("login-account", normalisedEmail, MAX_ACCOUNT_ATTEMPTS, LOCKOUT_DURATION_MS).ok) {
      audit("login_rate_limited", { route: "/api/auth/login", ip, email: normalisedEmail });
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    const store = await cookies();

    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    if (adminEmail && adminPassword && normalisedEmail === adminEmail) {
      if (timingSafeEqualStr(password, adminPassword)) {
        resetRateLimit("login-account", normalisedEmail);

        // The environment-backed admin account has no user row, so its
        // enrolment lives in the same keyed store as everyone else's.
        const twoFactor = await loadTwoFactor("admin-env");
        if (twoFactor?.enabled) {
          const challenge = createTwoFactorChallenge({
            sub: "admin-env",
            role: "ADMIN",
            email: normalisedEmail,
            name: "Admin",
          });
          if (challenge) {
            return NextResponse.json(
              { requiresTwoFactor: true, twoFactorToken: challenge },
              { status: 200 }
            );
          }
        }

        const token = createSessionToken({
          sub: "admin-env",
          role: "ADMIN",
          email: normalisedEmail,
          name: "Admin",
        });
        if (token) store.set("wox-session", token, sessionCookieOptions());

        return NextResponse.json({
          user: {
            id: "admin-env",
            name: "Admin",
            email: normalisedEmail,
            role: "ADMIN",
            token,
          },
        }, { status: 200 });
      }

      audit("login_failed", { route: "/api/auth/login", ip, email: normalisedEmail, reason: "admin_password" });
      // Same body as an unknown account so the endpoint cannot be used to
      // discover whether the admin email exists.
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await connectMongoDB();

    const user = await User.findOne({ email: normalisedEmail });
    if (!user) {
      audit("login_failed", { route: "/api/auth/login", ip, email: normalisedEmail, reason: "unknown_account" });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      audit("login_failed", { route: "/api/auth/login", ip, email: normalisedEmail, reason: "bad_password" });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Password is right. If this account enrolled a second factor, stop here
    // with a short-lived challenge instead of handing over a session — the
    // session only exists once the code matches.
    const twoFactor = await loadTwoFactor(String(user._id));
    if (twoFactor?.enabled) {
      const challenge = createTwoFactorChallenge({
        sub: String(user._id),
        role: user.role,
        email: user.email,
        name: user.name,
        version: Number(user.sessionVersion) || 0,
      });
      resetRateLimit("login-account", normalisedEmail);
      if (challenge) {
        return NextResponse.json(
          { requiresTwoFactor: true, twoFactorToken: challenge },
          { status: 200 }
        );
      }
    }

    const token = createSessionToken({
      sub: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
      version: Number(user.sessionVersion) || 0,
    });
    if (token) store.set("wox-session", token, sessionCookieOptions());
    resetRateLimit("login-account", normalisedEmail);
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("[LOGIN_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
