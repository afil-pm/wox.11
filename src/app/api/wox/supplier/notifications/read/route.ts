import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Notification from "@/lib/models/notification";
import { getSupplier } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

/**
 * Marks this supplier's notifications read. The user id comes from the signed
 * session, never from the body, so another supplier's rows can never be
 * marked (or unmarked) from here.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getSupplier(request, { requireVerified: false });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    const body = await request.json();
    const { notificationId, markAll } = body || {};
    if (!markAll && !notificationId) {
      return NextResponse.json({ error: "notificationId or markAll required" }, { status: 400 });
    }

    await connectMongoDB();
    const userId = auth.supplier.supplierId;

    if (markAll) {
      await Notification.updateMany({ userId, read: false }, { read: true });
    } else {
      await Notification.findOneAndUpdate({ _id: notificationId, userId }, { read: true });
    }

    const unreadCount = await Notification.countDocuments({ userId, read: false });
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error("POST /api/wox/supplier/notifications/read error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
