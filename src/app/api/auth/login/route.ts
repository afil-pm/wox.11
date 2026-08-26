import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
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
