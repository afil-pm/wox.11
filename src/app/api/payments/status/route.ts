import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order, { PAID_PAYMENT_STATUSES } from "@/lib/models/order";
import { confirmOrderPayment } from "@/lib/payments/confirm";
import { getOrderById } from "@/lib/payments/razorpay";

/**
 * Payment/order status for a gateway order. Also performs the confirmation
 * itself when the gateway already captured the payment, so an interrupted
 * checkout still converges to a confirmed order on the next poll.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const razorpayOrderId = searchParams.get("orderId");

    if (!razorpayOrderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    await connectMongoDB();
    const order = await Order.findOne({ razorpayOrderId }).lean();

    if (!order) {
      return NextResponse.json(
        { found: false, paid: false, status: "unknown" },
        { status: 404 }
      );
    }

    const base = {
      found: true,
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      paid: (PAID_PAYMENT_STATUSES as readonly string[]).includes(order.paymentStatus),
    };

    if (base.paid) {
      return NextResponse.json({ ...base, status: "paid", gatewayStatus: "paid" });
    }

    let gatewayStatus = "unknown";
    try {
      const gatewayOrder = await getOrderById(razorpayOrderId);
      gatewayStatus = gatewayOrder.status;

      if (gatewayOrder.status === "paid") {
        const result = await confirmOrderPayment({ razorpayOrderId, source: "api" });
        return NextResponse.json({
          ...base,
          paid: result.ok,
          paymentStatus: result.paymentStatus ?? base.paymentStatus,
          orderStatus: result.orderStatus ?? base.orderStatus,
          status: result.ok ? "paid" : result.status,
          gatewayStatus,
        });
      }
    } catch {
      gatewayStatus = "unknown";
    }

    return NextResponse.json({ ...base, status: "pending", gatewayStatus });
  } catch (error) {
    console.error("GET /api/payments/status error:", error);
    return NextResponse.json({ error: "Failed to fetch payment status" }, { status: 500 });
  }
}
