import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { confirmOrderPayment, markPaymentFailed } from "@/lib/payments/confirm";
import { recordPaymentReconciliation } from "@/lib/payments/reconciliation";

/**
 * Razorpay webhook. Signature verified, order matching is idempotent, so this
 * is the recovery path for a customer who paid and then left the site: the
 * order is created/confirmed here even if no browser callback ever runs.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payment = event.payload?.payment?.entity;

    if ((eventType === "payment.captured" || eventType === "order.paid") && payment) {
      await connectMongoDB();

      const result = await confirmOrderPayment({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        payment,
        amountPaise: payment.amount,
        currency: payment.currency,
        source: "webhook",
      });

      if (result.status === "order_not_found") {
        // Payment is real but could not be linked to an order: keep it for
        // reconciliation instead of dropping it.
        await recordPaymentReconciliation({
          paymentId: payment.id,
          razorpayOrderId: payment.order_id,
          amountPaise: payment.amount,
          currency: payment.currency,
          paymentStatus: payment.status,
          status: "UNMATCHED",
          reason: `Captured payment ${payment.id} has no matching order (gateway order ${payment.order_id}).`,
        });
      }

      return NextResponse.json({ received: true, status: result.status });
    }

    if (eventType === "payment.failed" && payment) {
      await markPaymentFailed({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
      });
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // A 500 makes Razorpay retry, which gives transient failures a second run.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
