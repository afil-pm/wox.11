import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Message from "@/lib/models/message";

function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" };
    return map[c];
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderEmail, senderName, message } = body;

    if (!senderEmail || !senderName || !message) {
      return NextResponse.json(
        { error: "Email, name, and message are required" },
        { status: 400 }
      );
    }

    if (typeof senderEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (senderName.trim().length < 2 || senderName.trim().length > 100) {
      return NextResponse.json({ error: "Name must be 2-100 characters" }, { status: 400 });
    }

    if (message.trim().length < 10 || message.trim().length > 2000) {
      return NextResponse.json({ error: "Message must be 10-2000 characters" }, { status: 400 });
    }

    const recent = await Message.findOne({
      senderEmail: senderEmail.trim().toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });

    if (recent) {
      return NextResponse.json(
        { error: "You can only send one request per hour. Please wait before sending another." },
        { status: 429 }
      );
    }

    await connectMongoDB();

    await Message.create({
      type: "account-recovery",
      senderEmail: senderEmail.trim().toLowerCase(),
      senderName: sanitize(senderName.trim()),
      message: sanitize(message.trim()),
    });

    return NextResponse.json({ message: "Recovery request sent successfully" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages/recovery error:", error);
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}
