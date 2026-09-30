import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { confirmOrderPayment, ConfirmResult } from "@/lib/payments/confirm";
import { verifyPayment } from "@/lib/payments/razorpay";

const STATUS_CODES: Record<string, number> = {
  confirmed: 200,
  already_paid: 200,
  not_captured: 202,
  order_not_found: 404,
  amount_mismatch: 409,
  payment_already_used: 409,
  verification_error: 503,
};

function toResponse(result: ConfirmResult): NextResponse {
  const httpStatus = STATUS_CODES[result.status] ?? 500;
  return NextResponse.json(result, { status: httpStatus });
}

/**
 * Server side payment confirmation. The gateway is queried directly, so a
 * customer closing the browser can never leave a paid order unconfirmed on
 * this path (the webhook covers the same case independently).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId && !razorpayPaymentId) {
      return NextResponse.json(
        { ok: false, status: "invalid_request", message: "Missing payment reference." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Browser callbacks must additionally prove the payload came from the
    // Razorpay checkout modal.
    if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      let signatureValid = false;
      try {
        signatureValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      } catch {
        signatureValid = false;
      }
      if (!signatureValid) {
        return NextResponse.json(
          {
            ok: false,
            status: "invalid_signature",
            message: "Payment signature verification failed.",
          },
          { status: 400 }
        );
      }
    }

    const result = await confirmOrderPayment({
      razorpayOrderId: razorpayOrderId || undefined,
      razorpayPaymentId: razorpayPaymentId || undefined,
      source: "api",
    });

    return toResponse(result);
  } catch (error) {
    console.error("POST /api/payments/confirm error:", error);
    return NextResponse.json(
      { ok: false, status: "error", message: "Payment confirmation failed." },
      { status: 500 }
    );
  }
}
