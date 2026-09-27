import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order, { PAID_PAYMENT_STATUSES } from "@/lib/models/order";
import { prepareOrderPayload } from "@/lib/orders/prepare";
import {
  createOrder as createRazorpayOrder,
  getOrderById,
} from "@/lib/payments/razorpay";
import { confirmOrderPayment, expirePendingPayments } from "@/lib/payments/confirm";

const PAYMENT_SESSION_MINUTES = 30;

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

function isPaidStatus(paymentStatus?: string): boolean {
  return !!paymentStatus && (PAID_PAYMENT_STATUSES as readonly string[]).includes(paymentStatus);
}

function alreadyPaidResponse(orderNumber: string, orderId: string): NextResponse {
  return NextResponse.json(
    {
      error: "This checkout has already been paid for.",
      alreadyPaid: true,
      orderNumber,
      orderId,
    },
    { status: 409 }
  );
}

/**
 * Creates the order record *before* money moves, so a payment can always be
 * matched back to it (even if the customer closes the tab), then opens a
 * Razorpay session for the server computed amount.
 */
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    const body = await request.json();

    const prepared = await prepareOrderPayload(body);
    if (!prepared.ok) {
      return NextResponse.json({ error: prepared.error }, { status: prepared.status });
    }
    const data = prepared.data;

    if (data.paymentMethod !== "razorpay") {
      return NextResponse.json(
        { error: "Checkout sessions are only available for online payments" },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to env." },
        { status: 500 }
      );
    }

    expirePendingPayments().catch(() => {});

    const checkoutSessionId =
      typeof body.checkoutSessionId === "string" ? body.checkoutSessionId.trim() : "";
    const paymentAmountPaise = Math.round(data.total * 100);
    const paymentExpiresAt = new Date(Date.now() + PAYMENT_SESSION_MINUTES * 60 * 1000);

    // Retries refresh these fields but keep the order number and gateway link
    // stable, so a late payment on an earlier gateway session still resolves.
    const checkoutFields: Record<string, unknown> = {
      userId: data.userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      address: data.address,
      items: data.items,
      subtotal: data.subtotal,
      couponCode: data.couponCode,
      couponDiscount: data.couponDiscount,
      shippingCost: data.shippingCost,
      tax: data.tax,
      total: data.total,
      taxDetails: data.taxDetails,
      paymentMethod: "razorpay",
      paymentStatus: "PAYMENT_PROCESSING",
      status: "PENDING",
      paymentId: "",
      inventoryAdjusted: false,
      paymentAmountPaise,
      paymentCurrency: "INR",
      paymentExpiresAt,
      notes: data.notes,
    };

    const orderData = {
      orderNumber: data.orderNumber,
      razorpayOrderId: "",
      ...checkoutFields,
      ...(checkoutSessionId ? { checkoutSessionId } : {}),
    };

    let order = checkoutSessionId ? await Order.findOne({ checkoutSessionId }) : null;

    if (order && isPaidStatus(order.paymentStatus)) {
      return alreadyPaidResponse(order.orderNumber, String(order._id));
    }

    if (order && order.paymentStatus === "REVIEW") {
      // The payment for this checkout is being reviewed: never overwrite the
      // evidence or silently restart the session.
      return NextResponse.json(
        {
          error: "The payment for this checkout is under review.",
          needsReview: true,
          orderNumber: order.orderNumber,
          orderId: String(order._id),
        },
        { status: 409 }
      );
    }

    if (order) {
      // Same checkout attempt (retry): refresh the unpaid order payload.
      await Order.updateOne(
        { _id: order._id, paymentStatus: { $nin: PAID_PAYMENT_STATUSES } },
        { $set: checkoutFields }
      ).catch(() => {});
      order = await Order.findById(order._id);
      if (order && isPaidStatus(order.paymentStatus)) {
        return alreadyPaidResponse(order.orderNumber, String(order._id));
      }
    } else {
      try {
        order = await Order.create(orderData);
      } catch (error) {
        if (checkoutSessionId && isDuplicateKey(error)) {
          order = await Order.findOne({ checkoutSessionId });
        }
        if (!order) throw error;
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Could not create the checkout order" }, { status: 500 });
    }

    // Reuse the gateway session when the amount and payment window are intact.
    let gatewayOrderId = "";
    if (
      order.razorpayOrderId &&
      order.paymentAmountPaise === paymentAmountPaise &&
      order.paymentExpiresAt &&
      order.paymentExpiresAt.getTime() > Date.now()
    ) {
      try {
        const gatewayOrder = await getOrderById(order.razorpayOrderId);
        if (gatewayOrder.status === "paid") {
          const result = await confirmOrderPayment({
            razorpayOrderId: gatewayOrder.id,
            source: "api",
          });
          return NextResponse.json(
            {
              alreadyPaid: true,
              orderNumber: order.orderNumber,
              orderId: order._id.toString(),
              paymentStatus: result.paymentStatus,
              orderStatus: result.orderStatus,
            },
            { status: 200 }
          );
        }
        gatewayOrderId = gatewayOrder.id;
      } catch {
        gatewayOrderId = "";
      }
    }

    if (!gatewayOrderId) {
      const razorpayOrder = await createRazorpayOrder(paymentAmountPaise, data.orderNumber, {
        orderNumber: data.orderNumber,
        checkout: "web",
      });
      gatewayOrderId = razorpayOrder.id;
      await Order.updateOne(
        { _id: order._id },
        { $set: { razorpayOrderId: gatewayOrderId } }
      ).catch(() => {});
      order.razorpayOrderId = gatewayOrderId;
    }

    return NextResponse.json({
      orderId: gatewayOrderId,
      amount: paymentAmountPaise,
      currency: "INR",
      keyId,
      orderNumber: order.orderNumber,
      orderDbId: order._id.toString(),
      paymentExpiresAt: order.paymentExpiresAt
        ? new Date(order.paymentExpiresAt).toISOString()
        : null,
    });
  } catch (error) {
    console.error("POST /api/payments/checkout error:", error);
    const msg = error instanceof Error ? error.message : "Checkout could not be started";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
