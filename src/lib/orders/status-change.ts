import Order from "@/lib/models/order";
import Notification from "@/lib/models/notification";
import { adjustStock } from "@/lib/orders/stock";
import { sendPushToUser } from "@/lib/push";

export const ORDER_STATUS_MESSAGES: Record<string, string> = {
  PENDING: "Your order has been placed and is pending confirmation.",
  CONFIRMED: "Your order has been confirmed!",
  PROCESSING: "Your order is being processed.",
  PACKED: "Your order has been packed and is ready to ship!",
  SHIPPED: "Your order has been shipped!",
  OUT_FOR_DELIVERY: "Your order is out for delivery today!",
  DELIVERED: "Your order has been delivered. Thank you!",
  CANCELLED: "Your order has been cancelled.",
  RETURNED: "Your order return has been initiated.",
  REFUNDED: "Your refund has been processed successfully.",
};

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "RETURNED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

export type StatusChangeResult =
  | { ok: true; order: unknown }
  | { ok: false; error: string; status: number };

/**
 * Shared order status transition used by the admin panel: validates the
 * transition, restores stock on cancellation and notifies the customer
 * exactly once.
 */
export async function applyOrderStatusChange(
  orderId: string,
  status: string
): Promise<StatusChangeResult> {
  if (!orderId || !status) {
    return { ok: false, error: "orderId and status are required", status: 400 };
  }
  if (!ORDER_STATUS_MESSAGES[status]) {
    return { ok: false, error: "Unknown order status", status: 400 };
  }

  const existingOrder = await Order.findById(orderId);
  if (!existingOrder) {
    return { ok: false, error: "Order not found", status: 404 };
  }

  const allowed = ORDER_STATUS_TRANSITIONS[existingOrder.status] || [];
  if (!allowed.includes(status)) {
    return {
      ok: false,
      error: `Cannot transition from ${existingOrder.status} to ${status}`,
      status: 400,
    };
  }

  const update: Record<string, unknown> = { status };
  if (
    status === "CANCELLED" &&
    (existingOrder.paymentStatus === "PAYMENT_PROCESSING" ||
      existingOrder.paymentStatus === "FAILED")
  ) {
    update.paymentStatus = "CANCELLED";
  }

  const order = await Order.findByIdAndUpdate(orderId, update, { new: true }).lean();

  // Stock is only restored for orders that actually deducted it; unpaid
  // online checkouts hold no inventory.
  if (
    status === "CANCELLED" &&
    existingOrder.items?.length &&
    existingOrder.inventoryAdjusted !== false
  ) {
    for (const item of existingOrder.items) {
      if (!item.slug) continue;
      // Colour aware restock: only the variant/size that was sold.
      await adjustStock(item, 1);
    }
    // The stock is back on the shelf: a late payment for this order must
    // deduct it again instead of double counting.
    await Order.updateOne({ _id: orderId }, { $set: { inventoryAdjusted: false } }).catch(
      () => {}
    );
  }

  if (existingOrder.userId && ORDER_STATUS_MESSAGES[status]) {
    const notificationTitle = `Order ${status.replace(/_/g, " ")}`;
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const existingNotification = await Notification.findOne({
      userId: existingOrder.userId,
      orderId: String(orderId),
      type: "order_update",
      createdAt: { $gte: oneMinuteAgo },
    })
      .lean()
      .catch(() => null);

    if (!existingNotification) {
      Notification.create({
        userId: existingOrder.userId,
        title: notificationTitle,
        body: `${ORDER_STATUS_MESSAGES[status]} (Order #${existingOrder.orderNumber})`,
        type: "order_update",
        orderId: String(orderId),
      }).catch(() => {});
    }

    sendPushToUser(existingOrder.userId, {
      title: notificationTitle,
      body: `${ORDER_STATUS_MESSAGES[status]} (Order #${existingOrder.orderNumber})`,
      url: `/account/orders/${orderId}`,
      tag: `order-${orderId}-${status}`,
    }).catch(() => {});
  }

  return { ok: true, order };
}
