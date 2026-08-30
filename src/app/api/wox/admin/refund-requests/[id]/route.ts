import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import RefundRequest from "@/lib/models/refund-request";
import Order from "@/lib/models/order";
import Notification from "@/lib/models/notification";
import { sendPushToUser } from "@/lib/push";
import { getDefaultPaymentProvider } from "@/lib/payments";

function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoDB();
    const { id } = await params;

    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, adminNotes, refundReferenceNumber } = body;

    const refundRequest = await RefundRequest.findById(id);
    if (!refundRequest) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    if (action === "approve") {
      refundRequest.status = "approved";
      refundRequest.adminNotes = adminNotes || "";
      await refundRequest.save();

      Notification.create({
        userId: refundRequest.userId,
        title: "Refund Approved",
        body: `Your refund request for order ${refundRequest.orderNumber} has been approved. We will process the refund shortly.`,
        type: "order_update",
        orderId: refundRequest.orderId,
      }).catch(() => {});

      sendPushToUser(refundRequest.userId, {
        title: "Refund Approved",
        body: `Your refund request for order ${refundRequest.orderNumber} has been approved.`,
        url: `/account/orders/${refundRequest.orderId}`,
        tag: `refund-${refundRequest.orderId}-approved`,
      }).catch(() => {});

      return NextResponse.json({ message: "Refund request approved", refundRequest });
    }

    if (action === "reject") {
      if (!adminNotes?.trim()) {
        return NextResponse.json({ error: "Admin notes are required when rejecting a refund" }, { status: 400 });
      }
      refundRequest.status = "rejected";
      refundRequest.adminNotes = adminNotes;
      await refundRequest.save();

      Notification.create({
        userId: refundRequest.userId,
        title: "Refund Rejected",
        body: `Your refund request for order ${refundRequest.orderNumber} has been rejected. Reason: ${adminNotes}`,
        type: "order_update",
        orderId: refundRequest.orderId,
      }).catch(() => {});

      sendPushToUser(refundRequest.userId, {
        title: "Refund Rejected",
        body: `Your refund request for order ${refundRequest.orderNumber} was rejected.`,
        url: `/account/orders/${refundRequest.orderId}`,
        tag: `refund-${refundRequest.orderId}-rejected`,
      }).catch(() => {});

      return NextResponse.json({ message: "Refund request rejected", refundRequest });
    }

    if (action === "process") {
      if (refundRequest.status !== "approved") {
        return NextResponse.json({ error: "Only approved refund requests can be processed" }, { status: 400 });
      }

      let refundTransactionId = "";

      if (refundRequest.paymentId) {
        try {
          const provider = getDefaultPaymentProvider();
          const result = await provider.processRefund(refundRequest.paymentId, refundRequest.amount);
          if (result.success) {
            refundTransactionId = result.refundId || "";
          } else {
            return NextResponse.json({ error: `Razorpay refund failed: ${result.error}` }, { status: 500 });
          }
        } catch (e) {
          console.error("Razorpay refund error:", e);
          return NextResponse.json({ error: "Failed to process refund via Razorpay" }, { status: 500 });
        }
      }

      refundRequest.status = "processed";
      refundRequest.refundTransactionId = refundTransactionId;
      refundRequest.refundReferenceNumber = refundReferenceNumber || "";
      refundRequest.adminNotes = adminNotes || "";
      refundRequest.processedAt = new Date();
      refundRequest.processedBy = "admin";
      await refundRequest.save();

      await Order.findByIdAndUpdate(refundRequest.orderId, {
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
      });

      Notification.create({
        userId: refundRequest.userId,
        title: "Refund Processed",
        body: `Your refund of ₹${refundRequest.amount} for order ${refundRequest.orderNumber} has been processed. It will be credited to your account within 5-7 business days.`,
        type: "order_update",
        orderId: refundRequest.orderId,
      }).catch(() => {});

      sendPushToUser(refundRequest.userId, {
        title: "Refund Processed",
        body: `Your refund of ₹${refundRequest.amount} for order ${refundRequest.orderNumber} has been processed.`,
        url: `/account/orders/${refundRequest.orderId}`,
        tag: `refund-${refundRequest.orderId}-processed`,
      }).catch(() => {});

      return NextResponse.json({ message: "Refund processed", refundRequest });
    }

    if (action === "complete") {
      if (refundRequest.status !== "processed") {
        return NextResponse.json({ error: "Only processed refunds can be marked as completed" }, { status: 400 });
      }

      refundRequest.status = "completed";
      refundRequest.adminNotes = adminNotes || refundRequest.adminNotes;
      await refundRequest.save();

      Notification.create({
        userId: refundRequest.userId,
        title: "Refund Completed",
        body: `Your refund for order ${refundRequest.orderNumber} has been completed and credited to your account.`,
        type: "order_update",
        orderId: refundRequest.orderId,
      }).catch(() => {});

      sendPushToUser(refundRequest.userId, {
        title: "Refund Completed",
        body: `Your refund for order ${refundRequest.orderNumber} has been completed.`,
        url: `/account/orders/${refundRequest.orderId}`,
        tag: `refund-${refundRequest.orderId}-completed`,
      }).catch(() => {});

      return NextResponse.json({ message: "Refund marked as completed", refundRequest });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/admin/refund-requests/[id] error:", error);
    return NextResponse.json({ error: "Failed to update refund request" }, { status: 500 });
  }
}
