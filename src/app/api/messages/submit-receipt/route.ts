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
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.senderEmail !== senderEmail.trim().toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (message.status !== "received") {
      return NextResponse.json({ error: "Message must be marked as received before submitting" }, { status: 400 });
    }

    message.status = "complete";
    await message.save();

    return NextResponse.json({ message: "Submit confirmed" });
  } catch (error) {
    console.error("POST /api/messages/submit-receipt error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
