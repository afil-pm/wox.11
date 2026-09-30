import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { validateNewPassword } from "@/lib/auth/password-policy";

const MAX_RESET_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    const { email, recoveryCode, newPassword } = await request.json();

    if (!email || !recoveryCode || !newPassword) {
      return NextResponse.json(
        { error: "Email, recovery code, and new password are required" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || typeof recoveryCode !== "string" || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (email.length > 254 || recoveryCode.length > 100) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const rateKey = `${ip}:${email.toLowerCase()}`;
    const rate = rateLimit("password-reset", rateKey, MAX_RESET_ATTEMPTS, LOCKOUT_DURATION_MS);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const passwordCheck = await validateNewPassword(newPassword);
    if (!passwordCheck.ok) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    await connectMongoDB();

    const normalizedCode = recoveryCode.trim().toUpperCase();
    const user = await User.findOne({
      email: email.toLowerCase(),
      recoveryCode: normalizedCode,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or recovery code" },
        { status: 401 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const newRecoveryCode = crypto.randomBytes(16).toString("hex").match(/.{1,4}/g)!.join("-").toUpperCase();

    user.password = passwordHash;
    user.recoveryCode = newRecoveryCode;
    // New password, new session epoch: every token minted before this point
    // (including one that may have been copied off the compromised account)
    // stops verifying from here on. See lib/auth/session-revocation.ts.
    user.sessionVersion = (Number(user.sessionVersion) || 0) + 1;
    await user.save();

    return NextResponse.json({
      message: "Password reset successful",
      recoveryCode: newRecoveryCode,
    });
  } catch (error) {
    console.error("[RESET_PASSWORD_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
