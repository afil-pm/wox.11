import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Notification from "@/lib/models/notification";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "";
    if (!userId) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    await connectMongoDB();
    const notifications = await Notification.find({ $or: [{ userId }, { userId: "all" }] })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unreadCount = await Notification.countDocuments({ $or: [{ userId }, { userId: "all" }], read: false });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, notificationBody, type, orderId } = body;

    if (!userId || !title || !notificationBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectMongoDB();
    const notification = await Notification.create({
      userId,
      title,
      body: notificationBody,
      type: type || "general",
      orderId: orderId || null,
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
