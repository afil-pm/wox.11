import Order from "@/lib/models/order";
import Product from "@/lib/models/product";
import { supplierOrderFilter, toSupplierOrder, SupplierOrderView } from "@/lib/supplier/view";

/**
 * Supplier scoped revenue and order analytics.
 *
 * Everything here is restricted to the supplier's own order lines (via
 * `supplierOrderFilter` + their own product slugs): another supplier's
 * products, orders or money can never end up in these numbers. Gross revenue
 * is the value of the supplier's own items before coupon/shipping/tax, and
 * cancelled / returned / refunded orders are excluded — the same rule the
 * existing sales report uses.
 */

const EXCLUDED_STATUSES = ["CANCELLED", "RETURNED", "REFUNDED"];
const MAX_ORDERS = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type RangeKey =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "week"
  | "month"
  | "lastmonth"
  | "year"
  | "all"
  | "custom";

export type Bucket = "day" | "week" | "month";

export interface ResolvedRange {
  key: RangeKey;
  from: Date | null;
  to: Date | null;
  label: string;
}

export interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
  units: number;
}

interface LeanOrder {
  _id: unknown;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  createdAt?: Date | string | null;
  items?: Array<{ slug?: string; name?: string; price?: number; quantity?: number }>;
}

const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  week: "This week",
  month: "This month",
  lastmonth: "Last month",
  year: "This year",
  all: "All time",
  custom: "Custom range",
};

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Start of the calendar day containing `ts`, in the caller's timezone. */
function startOfDay(ts: number, tzOffset: number): number {
  const shifted = new Date(ts + tzOffset * 60000);
  shifted.setUTCHours(0, 0, 0, 0);
  return shifted.getTime() - tzOffset * 60000;
}

/**
 * Resolves the requested period. `tzOffset` is the client's UTC offset in
 * minutes, so "today" means the seller's today rather than UTC's.
 */
export function resolveRange(input: {
  range?: string | null;
  from?: string | null;
  to?: string | null;
  tzOffset?: number;
}): ResolvedRange {
  const tzOffset = Number.isFinite(input.tzOffset) ? (input.tzOffset as number) : 0;
  const now = Date.now();
  const todayStart = startOfDay(now, tzOffset);
  const key = (input.range || "30d") as RangeKey;

  switch (key) {
    case "today":
      return { key, from: new Date(todayStart), to: new Date(now), label: RANGE_LABELS.today };
    case "yesterday":
      return {
        key,
        from: new Date(todayStart - DAY_MS),
        to: new Date(todayStart),
        label: RANGE_LABELS.yesterday,
      };
    case "7d":
      return {
        key,
        from: new Date(todayStart - 6 * DAY_MS),
        to: new Date(now),
        label: RANGE_LABELS["7d"],
      };
    case "30d":
      return {
        key,
        from: new Date(todayStart - 29 * DAY_MS),
        to: new Date(now),
        label: RANGE_LABELS["30d"],
      };
    case "week": {
      // Monday based week, in the caller's timezone.
      const day = new Date(todayStart).getUTCDay();
      const sinceMonday = (day + 6) % 7;
      return {
        key,
        from: new Date(todayStart - sinceMonday * DAY_MS),
        to: new Date(now),
        label: RANGE_LABELS.week,
      };
    }
    case "month": {
      const shifted = new Date(now + tzOffset * 60000);
      shifted.setUTCDate(1);
      shifted.setUTCHours(0, 0, 0, 0);
      return {
        key,
        from: new Date(shifted.getTime() - tzOffset * 60000),
        to: new Date(now),
        label: RANGE_LABELS.month,
      };
    }
    case "lastmonth": {
      const shifted = new Date(now + tzOffset * 60000);
      shifted.setUTCDate(1);
      shifted.setUTCHours(0, 0, 0, 0);
      const thisMonthStart = shifted.getTime() - tzOffset * 60000;
      const lastMonthStart = new Date(thisMonthStart);
      lastMonthStart.setUTCMonth(lastMonthStart.getUTCMonth() - 1);
      return {
        key,
        from: lastMonthStart,
        to: new Date(thisMonthStart),
        label: RANGE_LABELS.lastmonth,
      };
    }
    case "year": {
      const shifted = new Date(now + tzOffset * 60000);
      shifted.setUTCMonth(0, 1);
      shifted.setUTCHours(0, 0, 0, 0);
      return {
        key,
        from: new Date(shifted.getTime() - tzOffset * 60000),
        to: new Date(now),
        label: RANGE_LABELS.year,
      };
    }
    case "all":
      return { key, from: null, to: new Date(now), label: RANGE_LABELS.all };
    case "custom": {
      const from = asDate(input.from);
      const to = asDate(input.to);
      if (!from && !to) {
        return { key: "7d", from: new Date(todayStart - 6 * DAY_MS), to: new Date(now), label: RANGE_LABELS["7d"] };
      }
      return {
        key,
        from: from ? new Date(startOfDay(from.getTime(), tzOffset)) : null,
        to: to ? new Date(to.getTime() + DAY_MS - 1) : null,
        label: RANGE_LABELS.custom,
      };
    }
    default:
      return {
        key: "7d",
        from: new Date(todayStart - 6 * DAY_MS),
        to: new Date(now),
        label: RANGE_LABELS["7d"],
      };
  }
}

function bucketKey(ts: number, bucket: Bucket, tzOffset: number): string {
  const date = new Date(ts + tzOffset * 60000);
  if (bucket === "month") return date.toISOString().slice(0, 7);
  if (bucket === "day") return date.toISOString().slice(0, 10);
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - sinceMonday);
  return date.toISOString().slice(0, 10);
}

/** Buckets wide enough that the chart stays readable for the whole range. */
export function chooseBucket(from: Date | null, to: Date | null, tzOffset: number): Bucket {
  const start = from ? from.getTime() : startOfDay(Date.now(), tzOffset) - 30 * DAY_MS;
  const end = to ? to.getTime() : Date.now();
  const spanDays = Math.max(1, Math.ceil((end - start) / DAY_MS));
  if (spanDays <= 31) return "day";
  if (spanDays <= 182) return "week";
  return "month";
}

function bucketStartLabel(key: string, bucket: Bucket): string {
  if (bucket === "month") {
    const [year, month] = key.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[Number(month) - 1]} ${year}`;
  }
  const [, month, day] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(day)} ${months[Number(month) - 1]}`;
}

function nextBucketKey(key: string, bucket: Bucket): string {
  if (bucket === "month") {
    const [year, month] = key.split("-").map(Number);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
  }
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (bucket === "week" ? 7 : 1));
  return date.toISOString().slice(0, 10);
}

/**
 * Turns the buckets that actually had sales into a gap free timeline, so an
 * empty day shows up as a zero instead of disappearing from the chart.
 */
function fillBuckets(
  points: Map<string, DailyPoint>,
  from: Date | null,
  to: Date | null,
  bucket: Bucket,
  tzOffset: number
): DailyPoint[] {
  const sorted = [...points.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!from || !to || sorted.length === 0) return sorted;

  const startKey = bucketKey(from.getTime(), bucket, tzOffset);
  const endKey = bucketKey(to.getTime(), bucket, tzOffset);
  const filled: DailyPoint[] = [];
  let key = startKey;
  let guard = 0;
  while (key <= endKey && guard++ < 800) {
    filled.push(points.get(key) || { date: key, revenue: 0, orders: 0, units: 0 });
    key = nextBucketKey(key, bucket);
  }
  return filled.length > 0 ? filled : sorted;
}

function ownOrderValue(
  order: LeanOrder,
  ownedSlugs: Set<string>
): { revenue: number; units: number } {
  let revenue = 0;
  let units = 0;
  for (const item of order.items || []) {
    if (!item?.slug || !ownedSlugs.has(item.slug)) continue;
    revenue += (item.price || 0) * (item.quantity || 0);
    units += item.quantity || 0;
  }
  return { revenue, units };
}

async function fetchOrdersInRange(
  orFilter: Record<string, unknown>[],
  from: Date | null,
  to: Date | null
): Promise<LeanOrder[]> {
  const filter: Record<string, unknown> = {
    $and: [{ $or: orFilter }, { status: { $nin: EXCLUDED_STATUSES } }],
  };
  const range: Record<string, Date> = {};
  if (from) range.$gte = from;
  if (to) range.$lte = to;
  if (Object.keys(range).length > 0) filter.createdAt = range;

  return (await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(MAX_ORDERS)
    .select("orderNumber status paymentStatus createdAt items")
    .lean()) as unknown as LeanOrder[];
}

export interface SupplierDashboard {
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
    last7: number;
    total: number;
  };
  orders: {
    total: number;
    today: number;
    pending: number;
    open: number;
    completed: number;
    cancelled: number;
  };
  products: { listed: number; active: number; outOfStock: number };
  daily: DailyPoint[];
  recentOrders: SupplierOrderView[];
}

/**
 * Everything the dashboard overview needs, all of it scoped to this supplier.
 */
export async function computeSupplierDashboard(
  supplierId: string,
  slugs: string[],
  tzOffset = 0
): Promise<SupplierDashboard> {
  const ownedSlugs = new Set(slugs);
  const orFilter = supplierOrderFilter(supplierId, slugs);
  const orClause = { $or: orFilter };

  const now = Date.now();
  const todayStart = new Date(startOfDay(now, tzOffset));
  const weekStart = (() => {
    const day = new Date(startOfDay(now, tzOffset)).getUTCDay();
    return new Date(startOfDay(now, tzOffset) - ((day + 6) % 7) * DAY_MS);
  })();
  const monthStart = (() => {
    const d = new Date(now);
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  })();
  const yearStart = (() => {
    const d = new Date(now);
    d.setUTCMonth(0, 1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  })();

  const [
    totalOrders,
    todayOrders,
    pendingOrders,
    openOrders,
    completedOrders,
    cancelledOrders,
    products,
    recentRaw,
    allTimeRevenue,
  ] = await Promise.all([
    Order.countDocuments(orClause),
    Order.countDocuments({ ...orClause, createdAt: { $gte: todayStart } }),
    Order.countDocuments({ ...orClause, status: "PENDING" }),
    Order.countDocuments({
      ...orClause,
      status: { $in: ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"] },
    }),
    Order.countDocuments({
      ...orClause,
      status: { $in: ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] },
    }),
    Order.countDocuments({ ...orClause, status: { $in: ["CANCELLED", "RETURNED"] } }),
    Product.find({ supplierId })
      .select("slug isActive variants.sizes.quantity")
      .lean(),
    Order.find(orClause)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    totalSupplierRevenue(orFilter, ownedSlugs),
  ]);

  // Revenue for the shorter windows comes from one year-bounded read; the
  // all-time figure is aggregated above so nothing is truncated.
  const windowStart = new Date(Math.min(yearStart.getTime(), now - 7 * DAY_MS));
  const windowOrders = await fetchOrdersInRange(orFilter, windowStart, new Date(now));

  const revenue = {
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    last7: 0,
    total: allTimeRevenue,
  };
  const daily = new Map<string, DailyPoint>();

  for (const order of windowOrders) {
    const created = asDate(order.createdAt);
    if (!created) continue;
    const { revenue: value, units } = ownOrderValue(order, ownedSlugs);
    if (value <= 0) continue;

    const ts = created.getTime();
    if (ts >= weekStart.getTime()) revenue.week += value;
    if (ts >= monthStart.getTime()) revenue.month += value;
    if (ts >= yearStart.getTime()) revenue.year += value;
    if (ts >= now - 7 * DAY_MS) revenue.last7 += value;
    if (ts >= todayStart.getTime()) revenue.today += value;

    const key = bucketKey(ts, "day", tzOffset);
    const point = daily.get(key) || { date: key, revenue: 0, orders: 0, units: 0 };
    point.revenue += value;
    point.orders += 1;
    point.units += units;
    daily.set(key, point);
  }

  // Back-fill the last 7 days so the dashboard chart always has a column per day.
  const series: DailyPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = bucketKey(now - i * DAY_MS, "day", tzOffset);
    series.push(daily.get(key) || { date: key, revenue: 0, orders: 0, units: 0 });
  }

  let outOfStock = 0;
  let active = 0;
  for (const product of products as unknown as Array<{
    isActive?: boolean;
    variants?: Array<{ sizes?: Array<{ quantity?: number }> }>;
  }>) {
    if (product.isActive !== false) active += 1;
    const stock = (product.variants || []).reduce(
      (sum, variant) =>
        sum + (variant.sizes || []).reduce((s, size) => s + (size.quantity || 0), 0),
      0
    );
    if (stock <= 0) outOfStock += 1;
  }

  const owned = new Set(slugs);
  const recentOrders = (recentRaw as unknown as Array<Parameters<typeof toSupplierOrder>[0]>)
    .map((order) => toSupplierOrder(order, owned))
    .filter((view) => view.items.length > 0);

  return {
    revenue,
    orders: {
      total: totalOrders,
      today: todayOrders,
      pending: pendingOrders,
      open: openOrders,
      completed: completedOrders,
      cancelled: cancelledOrders,
    },
    products: { listed: products.length, active, outOfStock },
    daily: series,
    recentOrders,
  };
}

/** All-time gross value of this supplier's own lines (aggregated, not truncated). */
async function totalSupplierRevenue(
  orFilter: Record<string, unknown>[],
  ownedSlugs: Set<string>
): Promise<number> {
  if (ownedSlugs.size === 0) return 0;
  const rows = (await Order.aggregate([
    { $match: { $or: orFilter, status: { $nin: EXCLUDED_STATUSES } } },
    { $project: { items: 1 } },
    { $unwind: "$items" },
    { $match: { "items.slug": { $in: [...ownedSlugs] } } },
    {
      $group: {
        _id: null,
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
  ])) as Array<{ revenue?: number }>;
  return rows[0]?.revenue || 0;
}

export interface SupplierAnalytics {
  range: { key: RangeKey; from: string | null; to: string | null; label: string };
  bucket: Bucket;
  summary: { revenue: number; orders: number; units: number; aov: number };
  series: Array<DailyPoint & { label: string }>;
  topProducts: Array<{ slug: string; name: string; units: number; revenue: number; orders: number }>;
}

/** Time filtered revenue report for the analytics page. */
export async function computeSupplierAnalytics(
  supplierId: string,
  slugs: string[],
  resolved: ResolvedRange,
  tzOffset: number
): Promise<SupplierAnalytics> {
  const ownedSlugs = new Set(slugs);
  const orFilter = supplierOrderFilter(supplierId, slugs);
  const bucket = chooseBucket(resolved.from, resolved.to, tzOffset);
  const orders = await fetchOrdersInRange(orFilter, resolved.from, resolved.to);

  let revenue = 0;
  let units = 0;
  let orderCount = 0;
  const byBucket = new Map<string, DailyPoint>();
  const byProduct = new Map<
    string,
    { slug: string; name: string; units: number; revenue: number; orders: number }
  >();

  for (const order of orders) {
    const created = asDate(order.createdAt);
    if (!created) continue;
    const value = ownOrderValue(order, ownedSlugs);
    if (value.revenue <= 0) continue;
    revenue += value.revenue;
    units += value.units;
    orderCount += 1;

    const key = bucketKey(created.getTime(), bucket, tzOffset);
    const point = byBucket.get(key) || { date: key, revenue: 0, orders: 0, units: 0 };
    point.revenue += value.revenue;
    point.orders += 1;
    point.units += value.units;
    byBucket.set(key, point);

    for (const item of order.items || []) {
      if (!item?.slug || !ownedSlugs.has(item.slug)) continue;
      const entry = byProduct.get(item.slug) || {
        slug: item.slug,
        name: item.name || item.slug,
        units: 0,
        revenue: 0,
        orders: 0,
      };
      entry.units += item.quantity || 0;
      entry.revenue += (item.price || 0) * (item.quantity || 0);
      entry.orders += 1;
      byProduct.set(item.slug, entry);
    }
  }

  return {
    range: {
      key: resolved.key,
      from: resolved.from ? resolved.from.toISOString() : null,
      to: resolved.to ? resolved.to.toISOString() : null,
      label: resolved.label,
    },
    bucket,
    summary: {
      revenue,
      orders: orderCount,
      units,
      aov: orderCount > 0 ? revenue / orderCount : 0,
    },
    series: fillBuckets(byBucket, resolved.from, resolved.to, bucket, tzOffset).map((point) => ({
      ...point,
      label: bucketStartLabel(point.date, bucket),
    })),
    topProducts: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
  };
}
