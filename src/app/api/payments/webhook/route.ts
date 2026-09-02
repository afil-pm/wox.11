import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    if (eventType === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      if (!payment) {
        return NextResponse.json({ received: true });
      }

      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      await connectMongoDB();

      const order = await Order.findOne({ paymentId: razorpayOrderId });
      if (order && order.paymentStatus !== "PAID") {
        order.paymentId = razorpayPaymentId;
        order.paymentStatus = "PAID";
        order.paymentConfirmedAt = new Date();
        order.paymentConfirmationMethod = "online";
        await order.save();

        const { default: Notification } = await import("@/lib/models/notification");
        const { sendPushToUser } = await import("@/lib/push");

        Notification.create({
          userId: order.userId,
          title: "Payment Confirmed",
          body: `Payment received for order ${order.orderNumber}.`,
          type: "order_update",
          orderId: order._id.toString(),
        }).catch(() => {});

        sendPushToUser(order.userId, {
          title: "Payment Confirmed",
          body: `Payment received for order ${order.orderNumber}.`,
          url: `/account/orders/${order._id}`,
          tag: `payment-captured-${order._id}`,
        }).catch(() => {});
      }
    }

    if (eventType === "payment.failed") {
      const payment = event.payload?.payment?.entity;
      if (!payment) {
        return NextResponse.json({ received: true });
      }

      const razorpayOrderId = payment.order_id;

      await connectMongoDB();

      const order = await Order.findOne({ paymentId: razorpayOrderId });
      if (order) {
        order.paymentStatus = "FAILED";
        await order.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
