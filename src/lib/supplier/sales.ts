import Order from "@/lib/models/order";
import { supplierOrderFilter } from "@/lib/supplier/view";

const EXCLUDED_STATUSES = ["CANCELLED", "RETURNED", "REFUNDED"];
const MAX_SALES_ORDERS = 2000;

export interface SupplierSales {
  totals: { orders: number; units: number; revenue: number };
  products: Array<{ slug: string; name: string; units: number; revenue: number; orders: number }>;
  daily: Array<{ date: string; units: number; revenue: number }>;
}

/**
 * Sales report restricted to the supplier's own order lines: revenue is the
 * gross value of their items (before coupon/shipping/tax), cancelled, returned
 * and refunded orders are excluded.
 */
export async function computeSupplierSales(
  supplierId: string,
  slugs: string[],
  days: number
): Promise<SupplierSales> {
  const ownedSlugs = new Set(slugs);
  const filter: Record<string, unknown> = {
    $and: [
      { $or: supplierOrderFilter(supplierId, slugs) },
      { status: { $nin: EXCLUDED_STATUSES } },
    ],
  };

  if (days > 0) {
    filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(MAX_SALES_ORDERS)
    .lean();

  const totals = { orders: 0, units: 0, revenue: 0 };
  const byProduct = new Map<
    string,
    { slug: string; name: string; units: number; revenue: number; orders: number }
  >();
  const byDay = new Map<string, { units: number; revenue: number }>();

  for (const order of orders as unknown as Array<{
    _id: unknown;
    createdAt?: Date;
    items?: Array<{ slug?: string; name?: string; price?: number; quantity?: number }>;
  }>) {
    let orderUnits = 0;
    let orderRevenue = 0;

    for (const item of order.items || []) {
      if (!item.slug || !ownedSlugs.has(item.slug)) continue;
      const units = item.quantity || 0;
      const revenue = (item.price || 0) * units;
      orderUnits += units;
      orderRevenue += revenue;

      const entry = byProduct.get(item.slug) || {
        slug: item.slug,
        name: item.name || item.slug,
        units: 0,
        revenue: 0,
        orders: 0,
      };
      entry.units += units;
      entry.revenue += revenue;
      entry.orders += 1;
      byProduct.set(item.slug, entry);

      const day = order.createdAt ? new Date(order.createdAt) : null;
      if (day && !Number.isNaN(day.getTime())) {
        const key = day.toISOString().slice(0, 10);
        const bucket = byDay.get(key) || { units: 0, revenue: 0 };
        bucket.units += units;
        bucket.revenue += revenue;
        byDay.set(key, bucket);
      }
    }

    if (orderUnits > 0) {
      totals.orders += 1;
      totals.units += orderUnits;
      totals.revenue += orderRevenue;
    }
  }

  const daily: SupplierSales["daily"] = [];
  if (days > 0) {
    for (let i = days - 1; i >= 0; i--) {
      const key = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const bucket = byDay.get(key) || { units: 0, revenue: 0 };
      daily.push({ date: key, units: bucket.units, revenue: bucket.revenue });
    }
  } else {
    for (const [date, bucket] of [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))) {
      daily.push({ date, ...bucket });
    }
  }

  return {
    totals,
    products: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue),
    daily,
  };
}
