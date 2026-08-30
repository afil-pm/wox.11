import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Message from "@/lib/models/message";

function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const lastSeenOrders = searchParams.get("orders");
    const lastSeenMessages = searchParams.get("messages");

    await connectMongoDB();

    const now = new Date();
    const counts: Record<string, number> = {};

    const ordersSince = lastSeenOrders ? new Date(lastSeenOrders) : new Date(0);
    if (lastSeenOrders) {
      counts.orders = await Order.countDocuments({ createdAt: { $gt: ordersSince } });
    } else {
      counts.orders = await Order.countDocuments({});
    }

    const messagesSince = lastSeenMessages ? new Date(lastSeenMessages) : new Date(0);
    if (lastSeenMessages) {
      counts.messages = await Message.countDocuments({ createdAt: { $gt: messagesSince } });
    } else {
      counts.messages = await Message.countDocuments({});
    }

    counts.total = (counts.orders || 0) + (counts.messages || 0);

    return NextResponse.json({ counts, serverTime: now.toISOString() });
  } catch (error) {
    console.error("GET /api/admin/unread-counts error:", error);
    return NextResponse.json({ counts: { orders: 0, messages: 0, total: 0 }, serverTime: new Date().toISOString() });
  }
}
