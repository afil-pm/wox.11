import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Notification from "@/lib/models/notification";
import { scopedNotificationUserId } from "@/lib/auth/notification-scope";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAll } = body;
    const userId = scopedNotificationUserId(request, body.userId || "");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await connectMongoDB();

    if (markAll) {
      await Notification.updateMany({ $or: [{ userId }, { userId: "all" }], read: false }, { read: true });
    } else if (notificationId) {
      await Notification.findOneAndUpdate({ _id: notificationId, $or: [{ userId }, { userId: "all" }] }, { read: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/notifications/read error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
