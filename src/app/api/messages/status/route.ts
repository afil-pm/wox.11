import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Message from "@/lib/models/message";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    await connectMongoDB();

    const messages = await Message.find({
      senderEmail: email.trim().toLowerCase(),
      type: "account-recovery",
      status: { $nin: ["received", "complete"] },
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
