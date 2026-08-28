import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";

function generateRecoveryCode(): string {
  const bytes = crypto.randomBytes(16);
  return bytes.toString("hex").match(/.{1,4}/g)!.join("-").toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
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
      role: "CUSTOMER",
      recoveryCode,
    });

    return NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      recoveryCode,
    }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
