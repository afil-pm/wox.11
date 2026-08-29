import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";

const CLEAR_PASSWORD = process.env.ORDER_CLEAR_PASSWORD || "";

function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

const clearAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_CLEAR_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = clearAttempts.get(ip);
  if (!record || now > record.resetAt) {
    clearAttempts.set(ip, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
    return true;
  }
  if (record.count >= MAX_CLEAR_ATTEMPTS) return false;
  record.count++;
  return true;
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password || !CLEAR_PASSWORD) {
      return NextResponse.json(
        { error: "Incorrect password. Order history not cleared." },
        { status: 403 }
      );
    }

    const passwordBuf = Buffer.from(password);
    const clearBuf = Buffer.from(CLEAR_PASSWORD);
    if (passwordBuf.length !== clearBuf.length || !crypto.timingSafeEqual(passwordBuf, clearBuf)) {
      return NextResponse.json(
        { error: "Incorrect password. Order history not cleared." },
        { status: 403 }
      );
    }

    await connectMongoDB();
    const result = await Order.deleteMany({});
    return NextResponse.json({
      message: "All orders deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("DELETE /api/mongo/orders/clear error:", error);
    return NextResponse.json({ error: "Failed to delete orders" }, { status: 500 });
  }
}
