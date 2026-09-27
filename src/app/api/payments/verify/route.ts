import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { confirmOrderPayment } from "@/lib/payments/confirm";
import { verifyPayment } from "@/lib/payments/razorpay";

/**
 * Verifies a checkout callback: the signature is checked first, then the
 * payment itself is re-read from Razorpay and matched against the order
 * (amount, currency and capture status) before anything is marked as paid.
 */
export async function POST(request: NextRequest) {
  try {
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
