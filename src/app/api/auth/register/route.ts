import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";
import { createSessionToken } from "@/lib/auth/session";

function generateRecoveryCode(): string {
  const bytes = crypto.randomBytes(16);
  return bytes.toString("hex").match(/.{1,4}/g)!.join("-").toUpperCase();
}

const registerAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_REGISTER_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = registerAttempts.get(ip);
  if (!record || now > record.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
    return true;
  }
  if (record.count >= MAX_REGISTER_ATTEMPTS) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
    }

    const { name, email, password, phone, role, supplierName } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Self-registration only ever creates CUSTOMER or pending SUPPLIER accounts.
    const requestedRole = role === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER";
    if (requestedRole === "SUPPLIER" && (!supplierName || !String(supplierName).trim())) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }

    await connectMongoDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const recoveryCode = generateRecoveryCode();

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      phone: phone || undefined,
      role: requestedRole,
      recoveryCode,
      ...(requestedRole === "SUPPLIER"
        ? {
            supplierName: String(supplierName).trim(),
            supplierStatus: "PENDING",
            supplierPermissions: { canUpdateOrderStatus: false },
          }
        : {}),
    });

    const token = createSessionToken({
      sub: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        supplierName: user.supplierName || "",
        supplierStatus: user.supplierStatus,
        token,
      },
      recoveryCode,
    }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
