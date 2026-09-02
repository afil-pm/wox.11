import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
