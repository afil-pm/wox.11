import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Message from "@/lib/models/message";

export async function POST(request: NextRequest) {
  try {
    const { messageId, senderEmail } = await request.json();

    if (!messageId || !senderEmail) {
      return NextResponse.json({ error: "messageId and senderEmail are required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    await connectMongoDB();

    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: "Message not found or already confirmed" }, { status: 404 });
    }

    if (message.senderEmail !== senderEmail.trim().toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!message.adminReply) {
      return NextResponse.json({ error: "No admin reply to confirm" }, { status: 400 });
    }

    if (message.keyDeliveredAt) {
      await Message.findByIdAndDelete(messageId);
      return NextResponse.json({ message: "Recovery confirmed and conversation deleted" });
    }

    message.keyDeliveredAt = new Date();
    await message.save();

    await Message.findByIdAndDelete(messageId);

    return NextResponse.json({ message: "Recovery confirmed and conversation deleted" });
  } catch (error) {
    console.error("POST /api/messages/confirm-receipt error:", error);
    return NextResponse.json({ error: "Failed to confirm receipt" }, { status: 500 });
  }
}
