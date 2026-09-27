import Product from "@/lib/models/product";

/** Slugs of every product (active or not) owned by this supplier. */
export async function getSupplierSlugs(supplierId: string): Promise<string[]> {
  const products = await Product.find({ supplierId }).select("slug").lean();
  return [...new Set(products.map((p) => p.slug).filter(Boolean))];
}

/**
 * Orders that contain this supplier's products. Uses the stamped supplierIds
 * when present and falls back to item slugs for orders created before that
 * field existed.
 */
export function supplierOrderFilter(supplierId: string, slugs: string[]): Record<string, unknown>[] {
  const clauses: Record<string, unknown>[] = [{ supplierIds: supplierId }];
  if (slugs.length > 0) {
    clauses.push({ "items.slug": { $in: slugs } });
  }
  return clauses;
}

export interface SupplierOrderView {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: unknown;
  updatedAt: unknown;
  deliveredAt: unknown;
  customerName: string;
  customerPhone: string;
  address: unknown;
  items: unknown[];
  supplierSubtotal: number;
  units: number;
  orderTotal: number;
}

type LeanOrder = {
  _id: unknown;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  deliveredAt?: unknown;
  customerName?: string;
  customerPhone?: string;
  address?: unknown;
  total?: number;
  items?: Array<{ slug?: string; price?: number; quantity?: number }>;
};

/**
 * Projects an order down to the supplier's own order lines plus the delivery
 * information needed to fulfil them. Customer email, account id, payment
 * references, coupon codes, internal notes and the store-wide totals are
 * deliberately never exposed to suppliers.
 */
export function toSupplierOrder(raw: LeanOrder, ownedSlugs: Set<string>): SupplierOrderView {
  const ownItems = (raw.items || []).filter((item) => !!item.slug && ownedSlugs.has(item.slug));
  const supplierSubtotal = ownItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );
  const units = ownItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return {
    id: String(raw._id),
    orderNumber: raw.orderNumber || "",
    status: raw.status || "PENDING",
    paymentStatus: raw.paymentStatus || "PENDING",
    paymentMethod: raw.paymentMethod || "cod",
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
    deliveredAt: raw.deliveredAt ?? null,
    customerName: raw.customerName || "",
    customerPhone: raw.customerPhone || "",
    address: raw.address ?? null,
    items: ownItems,
    supplierSubtotal,
    units,
    orderTotal: raw.total || 0,
  };
}
