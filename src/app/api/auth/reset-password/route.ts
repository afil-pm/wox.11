import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";

export async function POST(request: NextRequest) {
  try {
    const { email, recoveryCode, newPassword } = await request.json();

    if (!email || !recoveryCode || !newPassword) {
      return NextResponse.json(
        { error: "Email, recovery code, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
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
