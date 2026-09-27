import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order, { PAID_PAYMENT_STATUSES } from "@/lib/models/order";
import { confirmOrderPayment } from "@/lib/payments/confirm";
import { getOrderById } from "@/lib/payments/razorpay";

/**
 * Cancels a checkout whose payment was abandoned (modal dismissed, QR
 * expired, ...). A checkout that the gateway already captured is confirmed
 * instead of cancelled, so money is never thrown away.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpayOrderId } = body;

    if (!razorpayOrderId) {
      return NextResponse.json(
        { ok: false, status: "invalid_request", message: "Missing payment reference." },
        { status: 400 }
      );
    }

    await connectMongoDB();
    const order = await Order.findOne({ razorpayOrderId });

    if (!order) {
      return NextResponse.json(
        { ok: false, status: "order_not_found", message: "No checkout matches this payment." },
        { status: 404 }
      );
    }

    const base = {
      orderNumber: order.orderNumber,
      orderId: String(order._id),
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
    };

    if ((PAID_PAYMENT_STATUSES as readonly string[]).includes(order.paymentStatus)) {
      return NextResponse.json({ ok: true, status: "already_paid", ...base });
    }

    let gatewayStatus = "";
    try {
      const gatewayOrder = await getOrderById(razorpayOrderId);
      gatewayStatus = gatewayOrder.status;

      if (gatewayOrder.status === "paid") {
        const result = await confirmOrderPayment({ razorpayOrderId, source: "api" });
        return NextResponse.json({
          ok: result.ok,
          status: result.status === "confirmed" ? "already_paid" : result.status,
          ...base,
          paymentStatus: result.paymentStatus ?? base.paymentStatus,
          orderStatus: result.orderStatus ?? base.orderStatus,
        });
      }
    } catch {
      return NextResponse.json(
        {
          ok: false,
          status: "gateway_unavailable",
          message: "Could not verify the payment with the gateway.",
        },
        { status: 503 }
      );
    }

    if (order.status !== "PENDING" || order.inventoryAdjusted === true) {
      return NextResponse.json({
        ok: false,
        status: "not_cancellable",
        message: `Order is ${order.status} and can no longer be cancelled here.`,
        ...base,
      });
    }

    const result = await Order.updateOne(
      {
        _id: order._id,
        status: "PENDING",
        paymentStatus: { $nin: PAID_PAYMENT_STATUSES },
      },
      { $set: { paymentStatus: "CANCELLED", status: "CANCELLED" } }
    );

    return NextResponse.json({
      ok: result.modifiedCount > 0,
      status: result.modifiedCount > 0 ? "cancelled" : "not_cancellable",
      gatewayStatus,
      ...base,
      paymentStatus: result.modifiedCount > 0 ? "CANCELLED" : base.paymentStatus,
      orderStatus: result.modifiedCount > 0 ? "CANCELLED" : base.orderStatus,
    });
  } catch (error) {
    console.error("POST /api/payments/cancel error:", error);
    return NextResponse.json(
      { ok: false, status: "error", message: "Checkout could not be cancelled." },
      { status: 500 }
    );
  }
}
