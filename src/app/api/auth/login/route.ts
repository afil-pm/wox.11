import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
    return true;
  }
  if (record.count >= MAX_LOGIN_ATTEMPTS) return false;
  record.count++;
  return true;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    if (adminEmail && adminPassword && email.toLowerCase() === adminEmail) {
      if (timingSafeEqualStr(password, adminPassword)) {
        return NextResponse.json({
          user: { id: "admin-env", name: "Admin", email: email.toLowerCase(), role: "ADMIN" },
        }, { status: 200 });
      }
    }

    await connectMongoDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    }, { status: 200 });
  } catch (error) {
    console.error("[LOGIN_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
