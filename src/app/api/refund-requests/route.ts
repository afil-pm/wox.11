import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import RefundRequest from "@/lib/models/refund-request";
import SavedBankDetails from "@/lib/models/saved-bank-details";
import Order from "@/lib/models/order";
import { encrypt } from "@/lib/encryption";

function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

const refundableStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const returnRefundStatuses = ["DELIVERED"];
const RETURN_WINDOW_DAYS = 7;
const MIN_PRODUCT_VALUE_FOR_RETURN = 199;

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    const body = await request.json();
    const { orderId, type, reason, saveBankDetails, useSavedBank } = body;
    const userId = request.headers.get("x-user-id") || "";

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!orderId || !type || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["cancel_refund", "return_refund"].includes(type)) {
      return NextResponse.json({ error: "Invalid refund type" }, { status: 400 });
    }

    let bankDetails = body.bankDetails;

    if (useSavedBank) {
      const saved = await SavedBankDetails.findOne({ userId }).lean();
      if (!saved) {
        return NextResponse.json({ error: "No saved bank details found" }, { status: 400 });
      }
      bankDetails = {
        accountHolderName: saved.accountHolderName,
        accountNumber: saved.accountNumber,
        ifscCode: saved.ifscCode,
        bankName: saved.bankName,
        upiId: saved.upiId || "",
      };
    } else if (!bankDetails) {
      return NextResponse.json({ error: "Bank details are required" }, { status: 400 });
    }

    if (!bankDetails.accountHolderName?.trim() || !bankDetails.accountNumber?.trim() || !bankDetails.ifscCode?.trim() || !bankDetails.bankName?.trim()) {
      return NextResponse.json({ error: "All bank details are required" }, { status: 400 });
    }

    if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(bankDetails.ifscCode.trim())) {
      return NextResponse.json({ error: "Invalid IFSC code format (e.g., SBIN0001234)" }, { status: 400 });
    }

    if (reason.trim().length < 5 || reason.trim().length > 500) {
      return NextResponse.json({ error: "Reason must be 5-500 characters" }, { status: 400 });
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Both online payment and COD are eligible for refund
    if (!["razorpay", "cod"].includes(order.paymentMethod)) {
      return NextResponse.json({ error: "Refund is not available for this payment method" }, { status: 400 });
    }

    // ₹199 minimum product value check — at least one item must exceed ₹199
    const hasEligibleProduct = order.items.some(
      (item: { price: number }) => item.price > MIN_PRODUCT_VALUE_FOR_RETURN
    );
    if (!hasEligibleProduct) {
      return NextResponse.json(
        { error: "Return/Refund is only available for products with value above ₹199" },
        { status: 400 }
      );
    }

    if (type === "return_refund" && !returnRefundStatuses.includes(order.status)) {
      return NextResponse.json({ error: "Return & refund is only available for delivered orders" }, { status: 400 });
    }

    if (type === "cancel_refund" && !refundableStatuses.includes(order.status)) {
      return NextResponse.json({ error: "Cancel & refund is not available for this order" }, { status: 400 });
    }

    if (type === "cancel_refund" && ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status)) {
      return NextResponse.json({ error: "Order has already been shipped. Please use Return & Refund instead." }, { status: 400 });
    }

    // 7-day return window check (from delivery date for return_refund)
    if (type === "return_refund") {
      const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt as unknown as string) : null;
      if (!deliveredAt) {
        return NextResponse.json({ error: "Delivery date not available for this order" }, { status: 400 });
      }
      const now = new Date();
      const daysSinceDelivery = Math.floor((now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
        return NextResponse.json(
          { error: `Return/Refund window has expired. Returns must be requested within ${RETURN_WINDOW_DAYS} days of delivery.` },
          { status: 400 }
        );
      }
    }

    // For cancel_refund on non-delivered orders, check order age (7 days from creation)
    if (type === "cancel_refund") {
      const createdAt = new Date(order.createdAt as unknown as string);
      const now = new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreation > RETURN_WINDOW_DAYS) {
        return NextResponse.json(
          { error: `Cancellation window has expired. Orders can only be cancelled within ${RETURN_WINDOW_DAYS} days of placement.` },
          { status: 400 }
        );
      }
    }

    const existingRequest = await RefundRequest.findOne({
      orderId,
      status: { $in: ["pending", "approved", "processed"] },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "A refund request for this order is already being processed" }, { status: 400 });
    }

    const encryptedAccountNumber = useSavedBank
      ? bankDetails.accountNumber
      : encrypt(bankDetails.accountNumber.trim());

    const refundRequest = await RefundRequest.create({
      orderId,
      orderNumber: order.orderNumber,
      userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail || "",
      type,
      reason: reason.trim(),
      amount: order.total,
      bankDetails: {
        accountHolderName: bankDetails.accountHolderName.trim(),
        accountNumber: encryptedAccountNumber,
        ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
        bankName: bankDetails.bankName.trim(),
        upiId: bankDetails.upiId?.trim() || "",
      },
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId || "",
    });

    if (saveBankDetails && !useSavedBank) {
      const existing = await SavedBankDetails.findOne({ userId });
      if (existing) {
        await SavedBankDetails.updateOne(
          { userId },
          {
            accountHolderName: bankDetails.accountHolderName.trim(),
            accountNumber: encryptedAccountNumber,
            ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
            bankName: bankDetails.bankName.trim(),
            upiId: bankDetails.upiId?.trim() || "",
          }
        );
      } else {
        await SavedBankDetails.create({
          userId,
          accountHolderName: bankDetails.accountHolderName.trim(),
          accountNumber: encryptedAccountNumber,
          ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
          bankName: bankDetails.bankName.trim(),
          upiId: bankDetails.upiId?.trim() || "",
        });
      }
    }

    const refundLabel = type === "cancel_refund" ? "Cancel & Refund" : "Return & Refund";
    const { default: Notification } = await import("@/lib/models/notification");
    const { sendPushToUser } = await import("@/lib/push");

    Notification.create({
      userId: "admin-env",
      title: "Refund Request",
      body: `${order.customerName} requested ${refundLabel} for order ${order.orderNumber} — ₹${order.total}`,
      type: "order_update",
      orderId,
    }).catch(() => {});

    sendPushToUser("admin-env", {
      title: "Refund Request",
      body: `${order.customerName} requested ${refundLabel} for order ${order.orderNumber} — ₹${order.total}`,
      url: "/wox/admin/orders",
      tag: `refund-request-${orderId}`,
    }).catch(() => {});

    return NextResponse.json({
      message: "Refund request submitted successfully",
      refundRequest: {
        _id: refundRequest._id,
        status: refundRequest.status,
        amount: refundRequest.amount,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/refund-requests error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit refund request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const userId = request.headers.get("x-user-id") || "";

    if (!userId && !isAdmin(request)) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (isAdmin(request)) {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      const filter: Record<string, unknown> = {};
      if (status && status !== "ALL") {
        filter.status = status;
      }
      const requests = await RefundRequest.find(filter).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ refundRequests: requests });
    }

    const requests = await RefundRequest.find({ userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ refundRequests: requests });
  } catch (error) {
    console.error("GET /api/refund-requests error:", error);
    return NextResponse.json({ error: "Failed to fetch refund requests" }, { status: 500 });
  }
}
