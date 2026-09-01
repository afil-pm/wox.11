import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Message from "@/lib/models/message";
import Notification from "@/lib/models/notification";
import { sendPushToUser } from "@/lib/push";

function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" };
    return map[c];
  });
}

const ipTimestamps: Map<string, number[]> = new Map();
const IP_RATE_LIMIT = 10;
const IP_RATE_WINDOW = 60 * 60 * 1000;

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipTimestamps.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < IP_RATE_WINDOW);
  ipTimestamps.set(ip, recent);
  return recent.length >= IP_RATE_LIMIT;
}

function recordIpRequest(ip: string) {
  const timestamps = ipTimestamps.get(ip) || [];
  timestamps.push(Date.now());
  ipTimestamps.set(ip, timestamps);
}

const VALID_TYPES = ["help-support", "feedback", "bug-report"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, senderEmail, senderName } = body;
    const senderUserId = request.headers.get("x-user-id") || "";

    if (!type || !message || !senderEmail || !senderName) {
      return NextResponse.json(
        { error: "Type, message, email, and name are required" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid message type" },
        { status: 400 }
      );
    }

    if (typeof senderEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (message.trim().length < 10 || message.trim().length > 2000) {
      return NextResponse.json({ error: "Message must be 10-2000 characters" }, { status: 400 });
    }

    if (senderName.trim().length < 2 || senderName.trim().length > 100) {
      return NextResponse.json({ error: "Name must be 2-100 characters" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

    if (isIpRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    await connectMongoDB();

    recordIpRequest(ip);

    const typeLabels: Record<string, string> = {
      "help-support": "Help / Support",
      "feedback": "Feedback",
      "bug-report": "Bug Report",
    };

    await Message.create({
      type,
      senderEmail: senderEmail.trim().toLowerCase(),
      senderUserId: senderUserId || "",
      senderName: sanitize(senderName.trim()),
      message: sanitize(message.trim()),
    });

    Notification.create({
      userId: "admin-env",
      title: `New ${typeLabels[type]}`,
      body: `${senderName.trim()} submitted a ${typeLabels[type].toLowerCase()} message.`,
      type: "message_reply",
    }).catch(() => {});

    sendPushToUser("admin-env", {
      title: `New ${typeLabels[type]}`,
      body: `${senderName.trim()} submitted a ${typeLabels[type].toLowerCase()} message.`,
      url: "/wox/admin/messages",
      tag: `admin-${type}`,
    }).catch(() => {});

    return NextResponse.json({ message: "Message submitted successfully" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages/help-feedback error:", error);
    return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
  }
}
