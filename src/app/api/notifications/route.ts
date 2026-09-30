import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Notification from "@/lib/models/notification";
import { scopedNotificationUserId } from "@/lib/auth/notification-scope";
import { isAdmin } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  try {
    const userId = await scopedNotificationUserId(request, request.headers.get("x-user-id") || "");
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
    // Nothing in the storefront creates notifications through this endpoint —
    // it exists for the admin/system side, so it needs an admin session.
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { title, notificationBody, type, orderId } = body;
    const userId = typeof body.userId === "string" ? body.userId : "";

    if (!userId || !title || !notificationBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof title !== "string" || title.length > 200 || typeof notificationBody !== "string" || notificationBody.length > 1000) {
      return NextResponse.json({ error: "Notification too long" }, { status: 400 });
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
