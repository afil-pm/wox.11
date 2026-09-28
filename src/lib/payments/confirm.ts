import { connectMongoDB } from "@/lib/mongodb";
import type { HydratedDocument } from "mongoose";
import Order, { PAID_PAYMENT_STATUSES, IOrder } from "@/lib/models/order";
import { adjustStock } from "@/lib/orders/stock";
import Coupon from "@/lib/models/coupon";
import Notification from "@/lib/models/notification";
import { sendPushToUser } from "@/lib/push";
import { sendNewOrderEmail } from "@/lib/email";
import {
  getOrderById,
  getPaymentById,
  listOrderPayments,
  RazorpayPayment,
} from "@/lib/payments/razorpay";
import {
  recordPaymentReconciliation,
  updateReconciliation,
} from "@/lib/payments/reconciliation";
import { notifyOrderSuppliers } from "@/lib/supplier/notify-suppliers";

export type ConfirmStatus =
  | "confirmed"
  | "already_paid"
  | "order_not_found"
  | "not_captured"
  | "amount_mismatch"
  | "verification_error";

export interface ConfirmResult {
  ok: boolean;
  status: ConfirmStatus;
  message?: string;
  orderId?: string;
  orderNumber?: string;
  paymentStatus?: string;
  orderStatus?: string;
}

export interface ConfirmInput {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  payment?: RazorpayPayment | null;
  amountPaise?: number;
  currency?: string;
  source: "webhook" | "api" | "reconcile" | "qr";
}

type OrderDoc = HydratedDocument<IOrder>;

async function loadOrder(input: {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}): Promise<OrderDoc | null> {
  await connectMongoDB();

  if (input.razorpayOrderId) {
    const byGatewayOrder = await Order.findOne({ razorpayOrderId: input.razorpayOrderId });
    if (byGatewayOrder) return byGatewayOrder;
  }

  if (input.razorpayPaymentId) {
    const byPayment = await Order.findOne({ paymentId: input.razorpayPaymentId });
    if (byPayment) return byPayment;
  }

  // Recovery path: the gateway order is the receipt of our order number, so a
  // payment can still be linked even if the link was never written to the DB.
  if (input.razorpayOrderId) {
    try {
      const gatewayOrder = await getOrderById(input.razorpayOrderId);
      if (gatewayOrder?.receipt) {
        const byReceipt = await Order.findOne({ orderNumber: gatewayOrder.receipt });
        if (byReceipt && !byReceipt.razorpayOrderId) {
          byReceipt.razorpayOrderId = input.razorpayOrderId;
          await Order.updateOne(
            { _id: byReceipt._id, razorpayOrderId: "" },
            { $set: { razorpayOrderId: input.razorpayOrderId } }
          );
        }
        if (byReceipt) return byReceipt;
      }
    } catch {
      // fall through, treated as order_not_found by the caller
    }
  }

  return null;
}

function isPaid(paymentStatus?: string): boolean {
  return !!paymentStatus && (PAID_PAYMENT_STATUSES as readonly string[]).includes(paymentStatus);
}

async function decrementStock(
  items: { slug?: string; size: string; color?: string | null; quantity: number; name: string }[]
): Promise<string[]> {
  const shortfalls: string[] = [];

  for (const item of items) {
    if (!item.slug) continue;
    const ok = await adjustStock(item, -1, { requireAvailable: true });
    if (!ok) {
      shortfalls.push(`${item.name} (${item.color ? item.color + ", " : ""}${item.size})`);
    }
  }

  return shortfalls;
}

async function notifyAdmin(title: string, body: string, orderId: string, tag: string) {
  Notification.create({
    userId: "admin-env",
    title,
    body,
    type: "order_update",
    orderId,
  }).catch(() => {});

  sendPushToUser("admin-env", {
    title,
    body,
    url: `/wox/admin/orders`,
    tag,
  }).catch(() => {});
}

/**
 * Deducts stock for a paid order exactly once. Used both when the payment is
 * confirmed and by the reconciliation sweep if the process died in between.
 * `inventoryAdjusted` is explicitly `false` for checkouts created after the
 * payment-first flow landed; legacy orders (field missing) were already
 * deducted at creation, so only `false` triggers a deduction.
 */
export async function ensureInventoryAdjusted(order: OrderDoc): Promise<string[]> {
  if (order.inventoryAdjusted !== false) return [];

  const shortfalls = await decrementStock(order.items || []);
  await Order.updateOne(
    { _id: order._id, inventoryAdjusted: { $ne: true } },
    { $set: { inventoryAdjusted: true } }
  );

  if (shortfalls.length > 0) {
    const note = `Stock shortfall after payment: ${shortfalls.join("; ")}`;
    const existingNotes = order.notes ? `${order.notes}\n` : "";
    await Order.updateOne(
      { _id: order._id },
      { $set: { notes: `${existingNotes}${note}` } }
    ).catch(() => {});

    await notifyAdmin(
      "Paid order needs stock review",
      `Order ${order.orderNumber} is paid but stock is short: ${shortfalls.join("; ")}.`,
      order._id.toString(),
      `stock-shortfall-${order._id}`
    );
  }

  return shortfalls;
}

/**
 * Runs everything that must happen exactly once when an online payment has
 * been verified: order promotion, inventory deduction, coupon usage,
 * notifications and the confirmation email.
 */
async function runPostPaymentSideEffects(
  order: OrderDoc,
  context: { paymentId: string; source: string }
): Promise<void> {
  const orderId = order._id.toString();
  const wasCancelled = order.status === "CANCELLED";

  // Promote the order out of its pre-payment state (PENDING / auto-cancelled).
  if (order.status === "PENDING" || order.status === "CANCELLED") {
    const promoted = await Order.findOneAndUpdate(
      { _id: order._id, status: { $in: ["PENDING", "CANCELLED"] } },
      { $set: { status: "CONFIRMED" } },
      { new: true }
    );
    if (promoted) {
      order.status = promoted.status;
      if (wasCancelled) {
        await notifyAdmin(
          "Payment received for cancelled order",
          `Payment ${context.paymentId} was received for order ${order.orderNumber}, which had been cancelled. The order has been reactivated.`,
          orderId,
          `reactivated-${orderId}`
        );
      }
    }
  }

  // Inventory is only deducted once the money is in.
  await ensureInventoryAdjusted(order);

  if (order.couponCode && order.couponDiscount > 0) {
    Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } }).catch(() => {});
  }

  const userMessage = `Payment received for order ${order.orderNumber}. Your order is confirmed.`;

  if (order.userId) {
    Notification.create({
      userId: order.userId,
      title: "Order Confirmed",
      body: userMessage,
      type: "order_update",
      orderId,
    }).catch(() => {});

    sendPushToUser(order.userId, {
      title: "Order Confirmed",
      body: userMessage,
      url: `/account/orders/${orderId}`,
      tag: `order-${orderId}-CONFIRMED`,
    }).catch(() => {});
  }

  await notifyAdmin(
    "New Order",
    `New order ${order.orderNumber} received from ${order.customerName} — ₹${order.total}`,
    orderId,
    `admin-order-${orderId}`
  );

  // The money is in: tell every supplier with a line in this order, and only
  // them. Deduped per supplier/order, so webhook + client + sweep converging
  // on the same payment still notifies once.
  await notifyOrderSuppliers({
    order,
    event: "payment",
    title: "Payment confirmed",
    body: `Payment received for order ${order.orderNumber}.`,
    url: "/wox/supplier/orders",
  });

  sendNewOrderEmail({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail || "",
    address: order.address,
    items: order.items || [],
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: "PAID",
  }).catch(() => {});

  updateReconciliation({
    paymentId: context.paymentId,
    orderNumber: order.orderNumber,
    orderId,
    status: "MATCHED",
    reason: `Payment ${context.paymentId} confirmed for order ${order.orderNumber} (${context.source}).`,
  }).catch(() => {});
}

/**
 * Verifies a Razorpay payment against the stored order and marks the order as
 * paid exactly once. Safe to call concurrently and repeatedly (webhook,
 * client callback and reconciliation all converge on the same result).
 */
export async function confirmOrderPayment(input: ConfirmInput): Promise<ConfirmResult> {
  const order = await loadOrder(input);

  if (!order) {
    return {
      ok: false,
      status: "order_not_found",
      message: "No order matches this payment.",
    };
  }

  const orderId = order._id.toString();
  const orderNumber = order.orderNumber;
  const base = { orderId, orderNumber, orderStatus: order.status, paymentStatus: order.paymentStatus };

  if (isPaid(order.paymentStatus)) {
    return { ok: true, status: "already_paid", ...base, paymentStatus: order.paymentStatus };
  }

  let payment: RazorpayPayment | null = input.payment || null;

  let verificationFailed = false;

  if (!payment && input.razorpayPaymentId) {
    try {
      payment = await getPaymentById(input.razorpayPaymentId);
    } catch {
      verificationFailed = true;
    }
  }

  // A webhook or a status poll can carry only the gateway order id (the
  // customer closed the tab): resolve the payment from the gateway so the
  // confirmation can still complete.
  if (!payment && input.razorpayOrderId) {
    try {
      const payments = await listOrderPayments(input.razorpayOrderId);
      payment =
        payments.find((p) => p.status === "captured" || p.captured) ||
        payments[0] ||
        null;
    } catch {
      verificationFailed = true;
    }
  }

  if (!payment) {
    if (verificationFailed) {
      return {
        ok: false,
        status: "verification_error",
        message: "Could not verify the payment with the gateway.",
        ...base,
      };
    }
    return {
      ok: false,
      status: "not_captured",
      message: "Payment has not been completed.",
      ...base,
    };
  }

  const expectedPaise = order.paymentAmountPaise ?? Math.round(order.total * 100);
  const expectedCurrency = (order.paymentCurrency || "INR").toUpperCase();
  const actualAmount = input.amountPaise ?? payment.amount;
  const actualCurrency = (input.currency || payment.currency || "INR").toUpperCase();
  let wrongGatewayOrder = false;
  if (payment.order_id && order.razorpayOrderId && payment.order_id !== order.razorpayOrderId) {
    // A superseded gateway session for the same checkout is fine as long as
    // its receipt points back at this order; anything else needs review.
    try {
      const gatewayOrder = await getOrderById(payment.order_id);
      wrongGatewayOrder = gatewayOrder?.receipt !== order.orderNumber;
    } catch {
      wrongGatewayOrder = true;
    }
  }

  if (wrongGatewayOrder || actualAmount !== expectedPaise || actualCurrency !== expectedCurrency) {
    const reason = wrongGatewayOrder
      ? `Payment ${payment.id} belongs to gateway order ${payment.order_id} but order ${orderNumber} expects ${order.razorpayOrderId}.`
      : `Payment ${payment.id} amount mismatch for ${orderNumber}: expected ${expectedPaise} ${expectedCurrency}, received ${actualAmount} ${actualCurrency}.`;

    await Order.updateOne(
      { _id: order._id, paymentStatus: { $nin: PAID_PAYMENT_STATUSES } },
      { $set: { paymentStatus: "REVIEW", paymentId: payment.id } }
    );

    await recordPaymentReconciliation({
      paymentId: payment.id,
      razorpayOrderId: payment.order_id || order.razorpayOrderId,
      amountPaise: actualAmount,
      currency: actualCurrency,
      paymentMethod: order.paymentMethod,
      paymentStatus: "REVIEW",
      status: "UNMATCHED",
      reason,
      orderId,
      orderNumber,
      customerName: order.customerName,
    });

    await notifyAdmin(
      "Payment needs review",
      `${reason} The order has been flagged for review.`,
      orderId,
      `payment-review-${orderId}`
    );

    return {
      ok: false,
      status: "amount_mismatch",
      message: reason,
      orderId,
      orderNumber,
      paymentStatus: "REVIEW",
      orderStatus: order.status,
    };
  }

  if (payment.status !== "captured" && !payment.captured) {
    return {
      ok: false,
      status: "not_captured",
      message: `Payment status is ${payment.status}.`,
      ...base,
    };
  }

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $nin: PAID_PAYMENT_STATUSES } },
    {
      $set: {
        paymentStatus: "PAID",
        paymentId: payment.id,
        paymentConfirmedAt: new Date(),
        paymentConfirmationMethod: "online",
        paymentConfirmedBy: input.source,
      },
    },
    { new: true }
  );

  if (!claimed) {
    const fresh = (await Order.findById(order._id)) as OrderDoc | null;
    return {
      ok: true,
      status: "already_paid",
      orderId,
      orderNumber,
      paymentStatus: fresh?.paymentStatus,
      orderStatus: fresh?.status,
    };
  }

  await runPostPaymentSideEffects(claimed as OrderDoc, {
    paymentId: payment.id,
    source: input.source,
  });

  return {
    ok: true,
    status: "confirmed",
    orderId,
    orderNumber,
    paymentStatus: "PAID",
    orderStatus: (claimed as OrderDoc).status,
  };
}

/**
 * Manual admin confirmation (payment verified outside of the gateway hooks).
 * Runs the exact same single-shot side effects as an automatic confirmation.
 */
export async function markOrderPaidManually(
  orderId: string,
  confirmedBy: string,
  paymentId?: string
): Promise<ConfirmResult> {
  await connectMongoDB();

  const order = (await Order.findById(orderId)) as OrderDoc | null;
  if (!order) {
    return { ok: false, status: "order_not_found", message: "Order not found." };
  }

  const base = {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
  };

  if (isPaid(order.paymentStatus)) {
    return { ok: true, status: "already_paid", ...base, paymentStatus: order.paymentStatus };
  }

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $nin: PAID_PAYMENT_STATUSES } },
    {
      $set: {
        paymentStatus: "PAID",
        paymentConfirmedAt: new Date(),
        paymentConfirmationMethod: "manual",
        paymentConfirmedBy: confirmedBy,
        ...(paymentId ? { paymentId } : {}),
      },
    },
    { new: true }
  );

  if (!claimed) {
    const fresh = (await Order.findById(order._id)) as OrderDoc | null;
    return {
      ok: true,
      status: "already_paid",
      orderId: base.orderId,
      orderNumber: base.orderNumber,
      paymentStatus: fresh?.paymentStatus,
      orderStatus: fresh?.status,
    };
  }

  await runPostPaymentSideEffects(claimed, {
    paymentId: paymentId || claimed.paymentId || "manual",
    source: "manual",
  });

  return {
    ok: true,
    status: "confirmed",
    orderId: base.orderId,
    orderNumber: base.orderNumber,
    paymentStatus: "PAID",
    orderStatus: claimed.status,
  };
}

/**
 * Marks an order's payment as failed without ever downgrading a payment that
 * has already been confirmed.
 */
export async function markPaymentFailed(input: {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}): Promise<void> {
  const order = await loadOrder(input);
  if (!order) return;
  if (isPaid(order.paymentStatus)) return;

  await Order.updateOne(
    { _id: order._id, paymentStatus: { $nin: PAID_PAYMENT_STATUSES } },
    { $set: { paymentStatus: "FAILED" } }
  );
}

/**
 * Cancels online checkouts whose payment session expired (abandoned or failed
 * payments). Inventory is never restored here because stock is only deducted
 * once a payment is confirmed.
 */
export async function expirePendingPayments(): Promise<number> {
  await connectMongoDB();

  const now = new Date();
  const stale = await Order.find({
    paymentStatus: { $in: ["PAYMENT_PROCESSING", "FAILED"] },
    paymentExpiresAt: { $lt: now },
  })
    .select("_id")
    .lean();

  for (const doc of stale) {
    const res = await Order.updateOne(
      {
        _id: doc._id,
        paymentStatus: { $in: ["PAYMENT_PROCESSING", "FAILED"] },
        paymentExpiresAt: { $lt: now },
      },
      { $set: { paymentStatus: "CANCELLED" } }
    );

    if (res.modifiedCount > 0) {
      await Order.updateOne(
        { _id: doc._id, status: "PENDING", paymentStatus: "CANCELLED" },
        { $set: { status: "CANCELLED" } }
      );
    }
  }

  return stale.length;
}
