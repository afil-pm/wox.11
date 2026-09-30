import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { notifyUser } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
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

    const { name, email, password, phone, role, supplierName } = await request.json();

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

    if (password.length < 8 || password.length > 200) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Self-registration only ever creates CUSTOMER or pending SUPPLIER accounts.
    const requestedRole = role === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER";
    if (requestedRole === "SUPPLIER" && (!supplierName || !String(supplierName).trim())) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
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
      role: requestedRole,
      recoveryCode,
      ...(requestedRole === "SUPPLIER"
        ? {
            supplierName: String(supplierName).trim(),
            // Server-side verification state: stays PENDING_VERIFICATION until
            // an admin verifies the account. Persisted in the database, so it
            // survives browser close/reopen, new tabs/devices and re-login.
            verificationStatus: "PENDING_VERIFICATION",
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
    if (token) (await cookies()).set("wox-session", token, sessionCookieOptions());

    // A new supplier account is waiting for review: tell the admin both in
    // the panel (durable row) and as a push. `dedupeKey` makes this idempotent,
    // and notifyUser never throws so registration cannot fail because of it.
    if (requestedRole === "SUPPLIER") {
      await notifyUser({
        userId: "admin-env",
        title: "New supplier verification pending",
        body: `${user.supplierName} (${user.email}) registered and is awaiting verification.`,
        type: "supplier_verification",
        url: "/wox/admin/suppliers",
        tag: `supplier-verification-${user._id}`,
        dedupeKey: `supplier:${user._id}:pending`,
      });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        supplierName: user.supplierName || "",
        verificationStatus: user.verificationStatus,
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
