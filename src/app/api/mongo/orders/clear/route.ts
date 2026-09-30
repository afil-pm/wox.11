import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import { isAdmin } from "@/lib/auth/guards";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const CLEAR_PASSWORD = process.env.ORDER_CLEAR_PASSWORD || "";

const MAX_CLEAR_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!rateLimit("order-clear", clientIp(request), MAX_CLEAR_ATTEMPTS, LOCKOUT_DURATION_MS).ok) {
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
