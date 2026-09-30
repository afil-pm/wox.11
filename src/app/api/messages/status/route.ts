import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Message from "@/lib/models/message";
import { recoveryAccessFilter } from "@/lib/auth/recovery-access";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ip = clientIp(request);

    const ipRate = rateLimit("recovery-status-ip", ip, 30, 60_000);
    const emailRate = rateLimit("recovery-status-email", normalizedEmail, 15, 60_000);
    if (!ipRate.ok || !emailRate.ok) {
      audit("recovery_status_rate_limited", { route: "/api/messages/status", ip, email: normalizedEmail });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.max(ipRate.retryAfterSeconds, emailRate.retryAfterSeconds)) } }
      );
    }

    // The admin's reply contains the recovery key, so an email address alone
    // must never be enough to read it.
    const access = await recoveryAccessFilter(request);
    if (!access) {
      audit("recovery_status_denied", { route: "/api/messages/status", ip, email: normalizedEmail });
      return NextResponse.json(
        { error: "Please send your recovery request from this browser, or use the lookup token you were given." },
        { status: 401 }
      );
    }

    await connectMongoDB();

    const messages = await Message.find({
      senderEmail: normalizedEmail,
      type: "account-recovery",
      status: { $nin: ["received", "complete"] },
      ...access,
    })
      .sort({ createdAt: -1 })
      .select("senderEmail senderName message status adminReply keyDeliveredAt createdAt updatedAt")
      .lean();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/messages/status error:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
