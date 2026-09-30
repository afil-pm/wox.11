import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { confirmOrderPayment } from "@/lib/payments/confirm";
import { verifyPayment } from "@/lib/payments/razorpay";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

/**
 * Verifies a checkout callback: the signature is checked first, then the
 * payment itself is re-read from Razorpay and matched against the order
 * (amount, currency and capture status) before anything is marked as paid.
 */
export async function POST(request: NextRequest) {
  try {
    const rate = rateLimit("payment-verify", clientIp(request), 30, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    let isValid = false;
    try {
      isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    await connectMongoDB();
    const result = await confirmOrderPayment({
      razorpayOrderId,
      razorpayPaymentId,
      source: "api",
    });

    if (result.status === "amount_mismatch") {
      return NextResponse.json(
        { verified: false, error: result.message || "Payment does not match the order." },
        { status: 409 }
      );
    }

    if (result.status === "order_not_found") {
      return NextResponse.json(
        { verified: false, error: "No order matches this payment yet." },
        { status: 404 }
      );
    }

    if (result.status === "payment_already_used") {
      return NextResponse.json(
        { verified: false, error: "This payment is already linked to another order." },
        { status: 409 }
      );
    }

    if (result.status === "not_captured" || result.status === "verification_error") {
      return NextResponse.json(
        { verified: false, error: result.message || "Payment is not confirmed yet." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      verified: true,
      orderNumber: result.orderNumber,
      orderId: result.orderId,
      paymentStatus: result.paymentStatus,
      orderStatus: result.orderStatus,
    });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
