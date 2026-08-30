import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";
import Notification from "@/lib/models/notification";
import { sendPushToUser } from "@/lib/push";

function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMED: "Your order has been confirmed!",
  PROCESSING: "Your order is being processed.",
  PACKED: "Your order has been packed and is ready to ship!",
  SHIPPED: "Your order has been shipped!",
  OUT_FOR_DELIVERY: "Your order is out for delivery today!",
  DELIVERED: "Your order has been delivered. Thank you!",
  CANCELLED: "Your order has been cancelled.",
  RETURNED: "Your order return has been initiated.",
};

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["PACKED", "CANCELLED"],
      PACKED: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["OUT_FOR_DELIVERY", "RETURNED"],
      OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"],
      DELIVERED: ["RETURNED"],
      CANCELLED: [],
      RETURNED: ["REFUNDED"],
      REFUNDED: [],
    };

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const allowed = validTransitions[existingOrder.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existingOrder.status} to ${status}` },
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true }).lean();

    if (status === "CANCELLED" && existingOrder.items?.length) {
      for (const item of existingOrder.items) {
        if (!item.slug) continue;
        await Product.updateOne(
          { slug: item.slug },
          { $inc: { "variants.$[v].sizes.$[s].quantity": item.quantity } },
          {
            arrayFilters: [
              { "v.sizes.name": item.size },
              { "s.name": item.size },
            ],
          }
        ).catch(() => {});
      }
    }

    if (existingOrder.userId && STATUS_MESSAGES[status]) {
      const notificationTitle = `Order ${status.replace(/_/g, " ")}`;
      Notification.create({
        userId: existingOrder.userId,
        title: notificationTitle,
        body: STATUS_MESSAGES[status],
        type: "order_update",
        orderId: String(orderId),
      }).catch(() => {});

      sendPushToUser(existingOrder.userId, {
        title: notificationTitle,
        body: STATUS_MESSAGES[status],
        url: `/account/orders/${orderId}`,
      }).catch(() => {});
    }

    return NextResponse.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("PUT /api/admin/orders error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
