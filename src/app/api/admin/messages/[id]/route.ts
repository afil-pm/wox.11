import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Message from "@/lib/models/message";
import Notification from "@/lib/models/notification";

function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" };
    return map[c];
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectMongoDB();
    const { id } = await params;
    const body = await request.json();
    const { status, adminReply } = body;

    const message = await Message.findById(id);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (status && ["pending", "reviewing", "resolved", "rejected"].includes(status)) {
      message.status = status;
    }

    if (adminReply !== undefined) {
      message.adminReply = sanitize(adminReply.trim());
    }

    await message.save();

    if (adminReply && message.senderUserId) {
      Notification.create({
        userId: message.senderUserId,
        title: "Admin Reply",
        body: "Admin has replied to your message. Check your messages for details.",
        type: "message_reply",
      }).catch(() => {});
    }

    return NextResponse.json({ message: message.toObject() });
  } catch (error) {
    console.error("PATCH /api/admin/messages/[id] error:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}
