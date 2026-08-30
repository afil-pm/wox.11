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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoDB();
    const { id } = await params;
    const userId = request.headers.get("x-user-id") || "";

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isAdmin(request) && order.userId !== userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET /api/mongo/orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoDB();
    const { id } = await params;
    const userId = request.headers.get("x-user-id") || "";
    const body = await request.json();
    const { status, paymentStatus } = body;

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const admin = isAdmin(request);
    if (!admin && order.userId !== userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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

    const update: Record<string, unknown> = {};

    const STATUS_MESSAGES: Record<string, string> = {
      PENDING: "Your order has been placed and is pending confirmation.",
      CONFIRMED: "Your order has been confirmed!",
      PROCESSING: "Your order is being processed.",
      PACKED: "Your order has been packed and is ready to ship!",
      SHIPPED: "Your order has been shipped!",
      OUT_FOR_DELIVERY: "Your order is out for delivery today!",
      DELIVERED: "Your order has been delivered. Thank you!",
      CANCELLED: "Your order has been cancelled.",
      RETURNED: "Your order return has been initiated.",
      REFUNDED: "Your refund has been processed successfully.",
    };

    if (status) {
      if (!admin) {
        return NextResponse.json({ error: "Only admin can change order status" }, { status: 403 });
      }
      const allowed = validTransitions[order.status] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${order.status} to ${status}` },
          { status: 400 }
        );
      }
      update.status = status;
    }

    if (paymentStatus) {
      if (!admin) {
        return NextResponse.json({ error: "Only admin can change payment status" }, { status: 403 });
      }
      update.paymentStatus = paymentStatus;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, update, { new: true }).lean();

    if (status === "CANCELLED" && order.items?.length) {
      const fullOrder = await Order.findById(id).lean();
      if (fullOrder?.items?.length) {
        for (const item of fullOrder.items) {
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
    }

    if (order.userId && status && STATUS_MESSAGES[status]) {
      const notificationTitle = `Order ${status.replace(/_/g, " ")}`;
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const existingNotification = await Notification.findOne({
        userId: order.userId,
        orderId: String(id),
        type: "order_update",
        createdAt: { $gte: oneMinuteAgo },
      }).lean().catch(() => null);

      if (!existingNotification) {
        Notification.create({
          userId: order.userId,
          title: notificationTitle,
          body: `${STATUS_MESSAGES[status]} (Order #${order.orderNumber})`,
          type: "order_update",
          orderId: String(id),
        }).catch(() => {});
      }

      sendPushToUser(order.userId, {
        title: notificationTitle,
        body: `${STATUS_MESSAGES[status]} (Order #${order.orderNumber})`,
        url: `/account/orders/${id}`,
        tag: `order-${id}-${status}`,
      }).catch(() => {});
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("PATCH /api/mongo/orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
