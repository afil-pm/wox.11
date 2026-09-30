import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import PushSubscription from "@/lib/models/push-subscription";
import { scopedNotificationUserId } from "@/lib/auth/notification-scope";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, p256dh, auth } = body;
    const userId = await scopedNotificationUserId(request, body.userId || "");

    if (!userId || !endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof endpoint !== "string" || endpoint.length > 2048) {
      return NextResponse.json({ error: "Invalid subscription endpoint" }, { status: 400 });
    }

    await connectMongoDB();
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId, endpoint, p256dh, auth },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/notifications/subscribe error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let endpoint = "";
    const { searchParams } = new URL(request.url);
    endpoint = searchParams.get("endpoint") || "";

    if (!endpoint) {
      try {
        const body = await request.json();
        endpoint = body.endpoint || "";
      } catch {}
    }

    if (!endpoint) {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    }

    await connectMongoDB();

    // Only the owner of a subscription (or the admin) may remove it — an
    // unauthenticated caller must not be able to mute somebody else's push
    // notifications by guessing/knowing the endpoint URL.
    const subscription = await PushSubscription.findOne({ endpoint })
      .select("userId")
      .lean() as { userId?: string } | null;

    if (subscription) {
      const userId = await scopedNotificationUserId(request, subscription.userId || "");
      if (!userId || userId !== subscription.userId) {
        return NextResponse.json({ error: "Not authorised to remove this subscription" }, { status: 403 });
      }
    }

    await PushSubscription.findOneAndDelete({ endpoint });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notifications/subscribe error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
