import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

interface RazorpayEvent {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        amount: number;
        status: string;
        order_id: string;
        method: string;
        email: string;
        contact: string;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        status: string;
      };
    };
  };
}

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("[WEBHOOK] Missing signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    if (!razorpayWebhookSecret) {
      console.error("[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const isValid = verifyWebhookSignature(body, signature, razorpayWebhookSecret);

    if (!isValid) {
      console.error("[WEBHOOK] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event: RazorpayEvent = JSON.parse(body);

    console.log(`[WEBHOOK] Received event: ${event.event}`);

    switch (event.event) {
      case "payment.captured": {
        const paymentEntity = event.payload.payment?.entity;
        if (!paymentEntity) {
          console.error("[WEBHOOK] Missing payment entity in payment.captured");
          return NextResponse.json(
            { error: "Invalid payload" },
            { status: 400 }
          );
        }

        const payment = await prisma.payment.findFirst({
          where: { razorpayId: paymentEntity.id },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              metadata: JSON.parse(JSON.stringify(paymentEntity)),
            },
          });
        }

        if (payment) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: "CONFIRMED" },
          });
        }

        console.log(`[WEBHOOK] Payment captured: ${paymentEntity.id}`);
        break;
      }

      case "payment.failed": {
        const paymentEntity = event.payload.payment?.entity;
        if (!paymentEntity) {
          console.error("[WEBHOOK] Missing payment entity in payment.failed");
          return NextResponse.json(
            { error: "Invalid payload" },
            { status: 400 }
          );
        }

        const failedPayment = await prisma.payment.findFirst({
          where: { razorpayId: paymentEntity.id },
        });

        if (failedPayment) {
          await prisma.payment.update({
            where: { id: failedPayment.id },
            data: {
              status: "FAILED",
              metadata: JSON.parse(JSON.stringify(paymentEntity)),
            },
          });
        }

        console.log(`[WEBHOOK] Payment failed: ${paymentEntity.id}`);
        break;
      }

      case "order.paid": {
        const orderEntity = event.payload.order?.entity;
        if (!orderEntity) {
          console.error("[WEBHOOK] Missing order entity in order.paid");
          return NextResponse.json(
            { error: "Invalid payload" },
            { status: 400 }
          );
        }

        const payment = await prisma.payment.findFirst({
          where: { razorpayOrderId: orderEntity.id },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "COMPLETED" },
          });

          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: "CONFIRMED" },
          });
        }

        console.log(`[WEBHOOK] Order paid: ${orderEntity.id}`);
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event: ${event.event}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[WEBHOOK_ERROR]", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
