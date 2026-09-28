import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Notification from "@/lib/models/notification";
import { sendPushToUser } from "@/lib/push";
import { getAdminEmail, isAdmin } from "@/lib/auth/guards";
import { notifyOrderSuppliers } from "@/lib/supplier/notify-suppliers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectMongoDB();
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentMethod !== "cod") {
      return NextResponse.json(
        { error: "Only COD orders can be confirmed manually" },
        { status: 400 }
      );
    }

    if (order.paymentStatus === "PAID" || order.paymentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Payment is already confirmed" },
        { status: 400 }
      );
    }

    const adminEmail = getAdminEmail(request);

    order.paymentStatus = "PAID";
    order.paymentConfirmedAt = new Date();
    order.paymentConfirmedBy = adminEmail;
    order.paymentConfirmationMethod = "manual";
    await order.save();

    if (order.userId) {
      Notification.create({
        userId: order.userId,
        title: "Payment Confirmed",
        body: `Your COD payment for order ${order.orderNumber} has been confirmed.`,
        type: "order_update",
        orderId: String(id),
      }).catch(() => {});

      sendPushToUser(order.userId, {
        title: "Payment Confirmed",
        body: `Your COD payment for order ${order.orderNumber} has been confirmed.`,
        url: `/account/orders/${id}`,
        tag: `payment-${id}-confirmed`,
      }).catch(() => {});
    }

    await notifyOrderSuppliers({
      order,
      event: "payment",
      title: "Payment confirmed",
      body: `COD payment for order ${order.orderNumber} has been confirmed.`,
      url: "/wox/supplier/orders",
    });

    return NextResponse.json({
      message: "COD payment confirmed",
      order: order.toObject(),
    });
  } catch (error) {
    console.error("POST /api/admin/orders/[id]/confirm-cod error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
