import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import PushSubscription from "@/lib/models/push-subscription";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, endpoint, p256dh, auth } = body;

    if (!userId || !endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    }

    await connectMongoDB();
    await PushSubscription.findOneAndDelete({ endpoint });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notifications/subscribe error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
