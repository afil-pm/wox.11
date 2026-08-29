import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";

const resetAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_RESET_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = resetAttempts.get(key);
  if (!record || now > record.resetAt) {
    resetAttempts.set(key, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
    return true;
  }
  if (record.count >= MAX_RESET_ATTEMPTS) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    const { email, recoveryCode, newPassword } = await request.json();

    if (!email || !recoveryCode || !newPassword) {
      return NextResponse.json(
        { error: "Email, recovery code, and new password are required" },
        { status: 400 }
      );
    }

    const rateKey = `${ip}:${email.toLowerCase()}`;
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again later." },
        { status: 429 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
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
