import Product from "@/lib/models/product";
import type { NotificationType } from "@/lib/models/notification";
import { notifyUser } from "@/lib/notify";

/** Minimum shape of an order needed to work out who owns which lines. */
export interface OrderForSuppliers {
  _id?: unknown;
  orderNumber?: string;
  /** Suppliers stamped on the order at creation time (may be missing on old orders). */
  supplierIds?: string[];
  items?: Array<{ slug?: string; price?: number; quantity?: number }>;
}

export interface SupplierOrderNotificationInput {
  order: OrderForSuppliers;
  /**
   * Stable event segment used in the dedupe key, e.g. `new`, `status:SHIPPED`,
   * `payment`. Retries of the same logical event never notify twice.
   */
  event: string;
  title: string;
  body: string;
  /** Defaults to the supplier orders page. */
  url?: string;
  /** Defaults to `order_update`. */
  type?: NotificationType;
}

interface OwnerInfo {
  supplierIds: string[];
  /** Gross value of the lines each supplier owns in this order. */
  revenueBySupplier: Map<string, number>;
}

/**
 * Works out which suppliers own lines of this order and how much each line is
 * worth. The stamped `supplierIds` field is the fast path; line slugs are used
 * both to recover ownership of orders created before that field existed and to
 * compute the per-supplier amount quoted in the notification body.
 */
async function resolveOwners(order: OrderForSuppliers): Promise<OwnerInfo> {
  const supplierIds = new Set<string>();
  for (const id of order.supplierIds || []) {
    const value = String(id || "").trim();
    if (value) supplierIds.add(value);
  }

  const revenueBySupplier = new Map<string, number>();
  const slugs = [
    ...new Set((order.items || []).map((item) => String(item?.slug || "").trim()).filter(Boolean)),
  ] as string[];

  if (slugs.length > 0) {
    const products = await Product.find({ slug: { $in: slugs } })
      .select("slug supplierId")
      .lean();
    const ownerBySlug = new Map<string, string>();
    for (const product of products) {
      const owner = String(product.supplierId || "").trim();
      if (!owner) continue;
      ownerBySlug.set(String(product.slug), owner);
      supplierIds.add(owner);
    }

    for (const item of order.items || []) {
      const owner = ownerBySlug.get(String(item?.slug || ""));
      if (!owner) continue;
      const value = (item.price || 0) * (item.quantity || 0);
      revenueBySupplier.set(owner, (revenueBySupplier.get(owner) || 0) + value);
    }
  }

  return { supplierIds: [...supplierIds], revenueBySupplier };
}

/**
 * Delivers an order event to every supplier whose products are in that order —
 * and only to them. Each supplier gets their own row keyed by their own user
 * id, so no supplier ever sees another supplier's order, and the unique
 * `dedupeKey` index keeps retries and repeated admin actions duplicate free.
 * Never throws: a notification problem must not fail the business operation.
 */
export async function notifyOrderSuppliers(
  input: SupplierOrderNotificationInput
): Promise<number> {
  try {
    const orderId = input.order?._id ? String(input.order._id) : "";
    if (!orderId) return 0;

    const owners = await resolveOwners(input.order);
    if (owners.supplierIds.length === 0) return 0;

    let delivered = 0;
    for (const supplierId of owners.supplierIds) {
      const share = owners.revenueBySupplier.get(supplierId);
      const body = share && share > 0 ? `${input.body} — ₹${share.toLocaleString("en-IN")}` : input.body;
      const result = await notifyUser({
        userId: supplierId,
        orderId,
        title: input.title,
        body,
        type: input.type ?? "order_update",
        url: input.url ?? "/wox/supplier/orders",
        tag: `supplier-order-${orderId}-${input.event}`,
        dedupeKey: `supplier:${supplierId}:order:${orderId}:${input.event}`,
      });
      if (result.created) delivered += 1;
    }

    return delivered;
  } catch (error) {
    console.error("notifyOrderSuppliers error:", error);
    return 0;
  }
}

/** Human readable helper shared by the call sites. */
export function orderRefLabel(order: OrderForSuppliers): string {
  return order?.orderNumber ? `#${order.orderNumber}` : "this order";
}

/**
 * Tells a supplier their product just sold its last unit. Deduped per product
 * and per day, so a product that keeps selling out does not spam the panel.
 */
export async function notifySupplierOutOfStock(product: {
  slug: string;
  name?: string;
  supplierId?: string;
}): Promise<boolean> {
  try {
    const supplierId = String(product.supplierId || "").trim();
    const slug = String(product.slug || "").trim();
    if (!supplierId || !slug) return false;

    const day = new Date().toISOString().slice(0, 10);
    const result = await notifyUser({
      userId: supplierId,
      title: "Product out of stock",
      body: `${product.name || slug} is now out of stock.`,
      type: "supplier_alert",
      url: "/wox/supplier/products",
      tag: `supplier-oos-${slug}`,
      dedupeKey: `supplier:${supplierId}:product:${slug}:out-of-stock:${day}`,
    });
    return result.created;
  } catch (error) {
    console.error("notifySupplierOutOfStock error:", error);
    return false;
  }
}
