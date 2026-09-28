import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Coupon from "@/lib/models/coupon";
import Notification from "@/lib/models/notification";
import { adjustStock } from "@/lib/orders/stock";
import { sendPushToUser } from "@/lib/push";
import { sendNewOrderEmail } from "@/lib/email";
import { prepareOrderPayload } from "@/lib/orders/prepare";
import { getPaymentById } from "@/lib/payments/razorpay";
import { recordPaymentReconciliation } from "@/lib/payments/reconciliation";
import { isAdmin } from "@/lib/auth/guards";
import { notifyOrderSuppliers } from "@/lib/supplier/notify-suppliers";


export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const status = searchParams.get("status");
    const userId = request.headers.get("x-user-id") || searchParams.get("userId") || "";

    if (!userId && !isAdmin(request)) {
      return NextResponse.json({ orders: [], total: 0 });
    }

    const filter: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (!isAdmin(request) && userId) {
      filter.userId = userId;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({ orders, total, limit, skip });
  } catch (error) {
    console.error("GET /api/mongo/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    const body = await request.json();

    const prepared = await prepareOrderPayload(body);
    if (!prepared.ok) {
      return NextResponse.json({ error: prepared.error }, { status: prepared.status });
    }
    const data = prepared.data;
    const {
      orderNumber,
      userId,
      customerName,
      customerPhone,
      customerEmail,
      address,
      paymentMethod,
      paymentId,
      notes,
      couponCode,
      total,
      subtotal: serverSubtotal,
      couponDiscount,
      shippingCost,
      tax,
      taxDetails,
      items: serverItems,
      supplierIds,
    } = data;


    // A payment reference sent by the client is never trusted on its own: the
    // payment is re-fetched from the gateway and must be captured for exactly
    // the server computed amount before this order can be marked as paid.
    let paymentStatus: "PENDING" | "PAID" | "REVIEW" = "PENDING";
    if (paymentId) {
      const expectedPaise = Math.round(total * 100);
      let verified = false;
      let reportedAmount = 0;
      let reportedCurrency = "";
      try {
        const payment = await getPaymentById(paymentId);
        reportedAmount = payment.amount;
        reportedCurrency = payment.currency;
        verified =
          payment.status === "captured" &&
          payment.amount === expectedPaise &&
          payment.currency.toUpperCase() === "INR";
      } catch {
        verified = false;
      }

      if (verified) {
        paymentStatus = "PAID";
      } else {
        paymentStatus = "REVIEW";
        recordPaymentReconciliation({
          paymentId,
          amountPaise: reportedAmount,
          currency: reportedCurrency,
          status: "UNMATCHED",
          orderNumber,
          reason: reportedAmount
            ? `Payment ${paymentId} is not a captured payment of the expected amount for ${orderNumber} (expected ${expectedPaise} paise, received ${reportedAmount} ${reportedCurrency}).`
            : `Payment ${paymentId} could not be verified with the gateway for ${orderNumber}.`,
        }).catch(() => {});
      }
    }

    for (const item of serverItems) {
      if (!item.slug) continue;
      // Colour aware: only the variant/size the customer picked is deducted.
      await adjustStock(item, -1, { requireAvailable: true });
    }

    const order = await Order.create({
      orderNumber,
      userId: userId || "",
      customerName: customerName || address.name,
      customerPhone: customerPhone || address.phone,
      customerEmail: customerEmail || "",
      address,
      items: serverItems,
      subtotal: serverSubtotal,
      couponCode,
      couponDiscount,
      shippingCost,
      tax,
      total,
      taxDetails,
      supplierIds,
      paymentMethod: paymentMethod || "cod",
      paymentId: paymentId || "",
      paymentStatus,
      razorpayOrderId: "",
      inventoryAdjusted: true,
      paymentConfirmedAt: paymentStatus === "PAID" ? new Date() : undefined,
      paymentConfirmedBy: paymentStatus === "PAID" ? "client" : undefined,
      paymentConfirmationMethod: paymentStatus === "PAID" ? "online" : undefined,
      status: "CONFIRMED",
      notes:
        paymentStatus === "REVIEW"
          ? `${notes ? `${notes}\n` : ""}Payment reference ${paymentId} requires manual verification.`
          : notes || "",
    });

    if (userId) {
      Notification.create({
        userId,
        title: "Order Confirmed",
        body: `Your order ${orderNumber} has been confirmed and is being processed.`,
        type: "order_update",
        orderId: order._id.toString(),
      }).catch(() => {});

      sendPushToUser(userId, {
        title: "Order Confirmed",
        body: `Your order ${orderNumber} has been confirmed and is being processed.`,
        url: `/account/orders/${order._id}`,
        tag: `order-${order._id}-CONFIRMED`,
      }).catch(() => {});
    }

    // A payment that still needs review has not really been paid yet: coupon
    // usage and the confirmation email wait for the admin decision.
    if (couponCode && couponDiscount > 0 && paymentStatus !== "REVIEW") {
      Coupon.updateOne({ code: couponCode }, { $inc: { usedCount: 1 } }).catch(() => {});
    }

    if (paymentStatus === "REVIEW") {
      Notification.create({
        userId: "admin-env",
        title: "Payment needs review",
        body: `Order ${orderNumber} was created with an unverified payment reference (${paymentId}).`,
        type: "order_update",
        orderId: order._id.toString(),
      }).catch(() => {});

      sendPushToUser("admin-env", {
        title: "Payment needs review",
        body: `Order ${orderNumber} has an unverified payment reference (${paymentId}).`,
        url: `/wox/admin/orders`,
        tag: `payment-review-${order._id}`,
      }).catch(() => {});
    }

    Notification.create({
      userId: "admin-env",
      title: "New Order",
      body: `New order ${orderNumber} received from ${customerName || address.name} — ₹${total}`,
      type: "order_update",
      orderId: order._id.toString(),
    }).catch(() => {});

    sendPushToUser("admin-env", {
      title: "New Order",
      body: `New order ${orderNumber} received from ${customerName || address.name} — ₹${total}`,
      url: `/wox/admin/orders`,
      tag: `admin-order-${order._id}`,
    }).catch(() => {});

    // The suppliers whose products are in this order are told about it — each
    // of them, and none of the others.
    await notifyOrderSuppliers({
      order: { _id: order._id, orderNumber, supplierIds, items: serverItems },
      event: "new",
      title: "New order received",
      body: `New order ${orderNumber} received from ${customerName || address.name}.`,
      url: "/wox/supplier/orders",
    });

    if (paymentStatus === "PAID") {
      await notifyOrderSuppliers({
        order: { _id: order._id, orderNumber, supplierIds, items: serverItems },
        event: "payment",
        title: "Payment confirmed",
        body: `Payment received for order ${orderNumber}.`,
        url: "/wox/supplier/orders",
      });
    }

    if (paymentStatus !== "REVIEW") {
      sendNewOrderEmail({
        orderNumber,
        customerName: customerName || address.name,
        customerPhone: customerPhone || address.phone,
        customerEmail: customerEmail || "",
        address,
        items: serverItems,
        total,
        paymentMethod: paymentMethod || "cod",
        paymentStatus,
      }).catch(() => {});
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/mongo/orders error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
