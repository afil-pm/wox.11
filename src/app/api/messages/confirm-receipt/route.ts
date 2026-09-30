import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Message from "@/lib/models/message";
import { ownsRecoveryMessage } from "@/lib/auth/recovery-access";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { messageId, senderEmail } = await request.json();

    if (!messageId || !senderEmail) {
      return NextResponse.json({ error: "messageId and senderEmail are required" }, { status: 400 });
    }

    if (typeof messageId !== "string" || !/^[a-f0-9]{24}$/i.test(messageId)) {
      return NextResponse.json({ error: "Invalid messageId" }, { status: 400 });
    }

    if (typeof senderEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const ip = clientIp(request);
    const rate = rateLimit("recovery-confirm-ip", ip, 20, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    await connectMongoDB();

    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.senderEmail !== senderEmail.trim().toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!(await ownsRecoveryMessage(request, message))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!message.adminReply) {
      return NextResponse.json({ error: "No admin reply to confirm" }, { status: 400 });
    }

    if (message.status === "received") {
      return NextResponse.json({ message: "Already confirmed" });
    }

    message.status = "received";
    message.keyDeliveredAt = message.keyDeliveredAt || new Date();
    await message.save();

    return NextResponse.json({ message: "Receipt confirmed" });
  } catch (error) {
    console.error("POST /api/messages/confirm-receipt error:", error);
    return NextResponse.json({ error: "Failed to confirm receipt" }, { status: 500 });
  }
}
