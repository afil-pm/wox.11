import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { validateNewPassword } from "@/lib/auth/password-policy";
import { audit } from "@/lib/security/audit";

function generateRecoveryCode(): string {
  const bytes = crypto.randomBytes(16);
  return bytes.toString("hex").match(/.{1,4}/g)!.join("-").toUpperCase();
}

const MAX_REGISTER_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    if (!rateLimit("register-ip", ip, MAX_REGISTER_ATTEMPTS, LOCKOUT_DURATION_MS).ok) {
      audit("register_rate_limited", { route: "/api/auth/register", ip });
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(LOCKOUT_DURATION_MS / 1000)) } }
      );
    }

    const { name, email, password, phone } = await request.json();

    if (
      !name || !email || !password ||
      typeof name !== "string" || typeof email !== "string" || typeof password !== "string"
    ) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 254) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ error: "Name must be 2-100 characters" }, { status: 400 });
    }

    const passwordCheck = await validateNewPassword(password);
    if (!passwordCheck.ok) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    await connectMongoDB();

    const existingUser = await User.findOne({ email: trimmedEmail.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const recoveryCode = generateRecoveryCode();

    const user = await User.create({
      name,
      email: trimmedEmail.toLowerCase(),
      password: passwordHash,
      phone: phone || undefined,
      role: "CUSTOMER",
      recoveryCode,
    });

    const token = createSessionToken({
      sub: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
      version: Number(user.sessionVersion) || 0,
    });
    if (token) (await cookies()).set("wox-session", token, sessionCookieOptions());

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
      recoveryCode,
    }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
