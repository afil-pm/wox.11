import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order, { PAID_PAYMENT_STATUSES } from "@/lib/models/order";
import PaymentReconciliation from "@/lib/models/payment-reconciliation";
import {
  confirmOrderPayment,
  ensureInventoryAdjusted,
  expirePendingPayments,
} from "@/lib/payments/confirm";
import { listPayments } from "@/lib/payments/razorpay";
import { recordPaymentReconciliation } from "@/lib/payments/reconciliation";
import { isAdmin } from "@/lib/auth/guards";

const MAX_PAGES = 5;
const PAGE_SIZE = 100;


/** Lists payments that are waiting for manual reconciliation. */
export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

    const filter: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const [records, counts] = await Promise.all([
      PaymentReconciliation.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      PaymentReconciliation.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]).catch(() => []),
    ]);

    return NextResponse.json({
      records,
      counts: counts as { _id: string; count: number }[],
      total: await PaymentReconciliation.countDocuments(filter),
    });
  } catch (error) {
    console.error("GET /api/payments/reconcile error:", error);
    return NextResponse.json({ error: "Failed to fetch reconciliation data" }, { status: 500 });
  }
}

/**
 * Scans recent gateway payments and repairs everything that can be matched
 * safely; anything that cannot is stored as needing review.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get("days") || "7", 10), 1), 30);

    const summary = {
      scanned: 0,
      confirmed: 0,
      alreadyPaid: 0,
      unmatched: 0,
      mismatched: 0,
      repaired: 0,
      expiredCheckouts: 0,
      errors: 0,
    };

    summary.expiredCheckouts = await expirePendingPayments();

    const from = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);

    for (let page = 0; page < MAX_PAGES; page++) {
      let payments;
      try {
        payments = await listPayments({ from, count: PAGE_SIZE, skip: page * PAGE_SIZE });
      } catch (error) {
        console.error("reconcile: listPayments failed:", error);
        summary.errors++;
        break;
      }

      if (payments.length === 0) break;

      for (const payment of payments) {
        summary.scanned++;
        if (payment.status !== "captured") continue;

        try {
          const order = await Order.findOne({
            $or: [{ razorpayOrderId: payment.order_id }, { paymentId: payment.id }],
          });

          if (
            order &&
            (PAID_PAYMENT_STATUSES as readonly string[]).includes(order.paymentStatus)
          ) {
            summary.alreadyPaid++;
            if (order.inventoryAdjusted === false) {
              await ensureInventoryAdjusted(order);
              summary.repaired++;
            }
            continue;
          }

          const result = await confirmOrderPayment({
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
            payment,
            amountPaise: payment.amount,
            currency: payment.currency,
            source: "reconcile",
          });

          if (result.status === "confirmed") {
            summary.confirmed++;
          } else if (result.status === "already_paid") {
            summary.alreadyPaid++;
          } else if (result.status === "order_not_found") {
            summary.unmatched++;
            await recordPaymentReconciliation({
              paymentId: payment.id,
              razorpayOrderId: payment.order_id,
              amountPaise: payment.amount,
              currency: payment.currency,
              paymentStatus: payment.status,
              status: "UNMATCHED",
              reason: `Captured payment ${payment.id} has no matching order (gateway order ${payment.order_id}).`,
            });
          } else if (result.status === "amount_mismatch") {
            summary.mismatched++;
          } else if (result.status === "not_captured") {
            // nothing to reconcile
          } else {
            summary.errors++;
          }
        } catch (error) {
          summary.errors++;
          console.error("reconcile: payment processing failed:", error);
        }
      }

      if (payments.length < PAGE_SIZE) break;
    }

    return NextResponse.json({ ok: true, summary, reconciledAt: new Date().toISOString() });
  } catch (error) {
    console.error("POST /api/payments/reconcile error:", error);
    return NextResponse.json({ error: "Reconciliation failed" }, { status: 500 });
  }
}
