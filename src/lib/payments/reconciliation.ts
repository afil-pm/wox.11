import { connectMongoDB } from "@/lib/mongodb";
import PaymentReconciliation, {
  ReconciliationStatus,
} from "@/lib/models/payment-reconciliation";
import Notification from "@/lib/models/notification";
import { sendPushToUser } from "@/lib/push";

export interface ReconciliationInput {
  paymentId?: string;
  razorpayOrderId?: string;
  amountPaise?: number;
  currency?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: ReconciliationStatus;
  reason: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  notifyAdmin?: boolean;
}

function buildKey(input: {
  paymentId?: string;
  razorpayOrderId?: string;
  orderNumber?: string;
}): string {
  if (input.paymentId) return `pay:${input.paymentId}`;
  if (input.razorpayOrderId) return `rzp:${input.razorpayOrderId}`;
  if (input.orderNumber) return `order:${input.orderNumber}`;
  return `unknown:${Date.now()}`;
}

function pickFields(input: ReconciliationInput): Record<string, unknown> {
  const fields: Record<string, unknown> = { reason: input.reason };
  if (input.paymentId !== undefined) fields.paymentId = input.paymentId;
  if (input.razorpayOrderId !== undefined) fields.razorpayOrderId = input.razorpayOrderId;
  if (input.amountPaise !== undefined) fields.amountPaise = input.amountPaise;
  if (input.currency !== undefined) fields.currency = input.currency;
  if (input.paymentMethod !== undefined) fields.paymentMethod = input.paymentMethod;
  if (input.paymentStatus !== undefined) fields.paymentStatus = input.paymentStatus;
  if (input.orderId !== undefined) fields.orderId = input.orderId;
  if (input.orderNumber !== undefined) fields.orderNumber = input.orderNumber;
  if (input.customerName !== undefined) fields.customerName = input.customerName;
  return fields;
}

async function notifyAdmin(input: ReconciliationInput, key: string): Promise<void> {
  const amount =
    input.amountPaise && input.amountPaise > 0 ? ` of ₹${(input.amountPaise / 100).toFixed(2)}` : "";
  const ref = input.paymentId || input.razorpayOrderId || input.orderNumber || "unknown";
  const body = `Payment${amount} (${ref}) needs review: ${input.reason}`;

  Notification.create({
    userId: "admin-env",
    title: "Payment needs reconciliation",
    body,
    type: "order_update",
    orderId: input.orderId || key,
  }).catch(() => {});

  sendPushToUser("admin-env", {
    title: "Payment needs reconciliation",
    body,
    url: `/wox/admin/orders`,
    tag: `reconcile-${key}`,
  }).catch(() => {});
}

/**
 * Stores a payment that could not be safely matched to an order (or that
 * needs manual verification) so it is never silently lost.
 */
export async function recordPaymentReconciliation(input: ReconciliationInput): Promise<void> {
  try {
    await connectMongoDB();
    const key = buildKey(input);
    const fields = pickFields(input);
    const status = input.status || "UNMATCHED";

    const existing = await PaymentReconciliation.findOne({ key }).lean().catch(() => null);

    if (!existing) {
      await PaymentReconciliation.create({ key, status, ...fields }).catch(() => {});
      if (input.notifyAdmin !== false) {
        await notifyAdmin(input, key);
      }
      return;
    }

    const update: Record<string, unknown> = { ...fields };
    if (existing.status === "UNMATCHED" && status !== "UNMATCHED") {
      update.status = status;
      if (status === "RESOLVED" || status === "MATCHED") {
        update.resolvedAt = new Date();
      }
    }
    await PaymentReconciliation.updateOne({ key }, { $set: update }).catch(() => {});
  } catch (error) {
    console.error("recordPaymentReconciliation error:", error);
  }
}

/**
 * Marks previously recorded reconciliation entries as resolved/matched once
 * the payment has been linked to an order.
 */
export async function updateReconciliation(input: {
  paymentId?: string;
  razorpayOrderId?: string;
  orderNumber?: string;
  status: ReconciliationStatus;
  reason?: string;
  orderId?: string;
}): Promise<void> {
  try {
    await connectMongoDB();
    const filter: Record<string, unknown> = {};
    if (input.paymentId) filter.paymentId = input.paymentId;
    if (input.razorpayOrderId) filter.razorpayOrderId = input.razorpayOrderId;
    if (input.orderNumber) filter.orderNumber = input.orderNumber;
    if (Object.keys(filter).length === 0) return;

    const update: Record<string, unknown> = { status: input.status };
    if (input.reason) update.reason = input.reason;
    if (input.orderId) update.orderId = input.orderId;
    if (input.status === "RESOLVED" || input.status === "MATCHED") {
      update.resolvedAt = new Date();
    }

    await PaymentReconciliation.updateMany(filter, { $set: update }).catch(() => {});
  } catch (error) {
    console.error("updateReconciliation error:", error);
  }
}
