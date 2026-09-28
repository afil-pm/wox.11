"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bell,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import WoxLoader from "@/components/ui/wox-loader";
import { supplierFetch } from "@/lib/supplier-api";
import { formatPrice } from "@/lib/utils";
import RevenueChart from "@/components/supplier/revenue-chart";
import {
  useSupplierNotifications,
  SupplierNotification,
} from "@/lib/stores/supplier-notifications";

interface SupplierOrder {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string | null;
  supplierSubtotal: number;
  units: number;
}

interface StatsResponse {
  supplier?: { name: string };
  revenue: { today: number; week: number; month: number; year: number; last7: number; total: number };
  orders: {
    total: number;
    today: number;
    pending: number;
    open: number;
    completed: number;
    cancelled: number;
  };
  products: { listed: number; active: number; outOfStock: number };
  daily: { date: string; revenue: number; orders: number; units: number }[];
  recentOrders: SupplierOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  PACKED: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-cyan-100 text-cyan-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-gray-200 text-gray-700",
  REFUNDED: "bg-gray-200 text-gray-700",
};

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones: Record<string, string> = {
    default: "text-zinc-900",
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-700",
  };
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{children}</h2>
      {action}
    </div>
  );
}

function notificationTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SupplierDashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");
  const notifications = useSupplierNotifications((s) => s.notifications);
  const refreshNotifications = useSupplierNotifications((s) => s.refresh);

  useEffect(() => {
    const tzOffset = -new Date().getTimezoneOffset();
    let cancelled = false;

    const load = async () => {
      try {
        const res = await supplierFetch(`/api/wox/supplier/stats?tzOffset=${tzOffset}`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.error && !data.revenue) {
          setError(data.error);
          return;
        }
        setStats(data);
      } catch {
        if (!cancelled) setError("Could not load the dashboard.");
      }
    };

    load();
    refreshNotifications();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshNotifications]);

  if (error) {
    return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <WoxLoader />
      </div>
    );
  }

  const supplierName = stats.supplier?.name || "Supplier";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{supplierName}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your listings, orders and revenue — updated just now.
        </p>
      </div>

      <section>
        <SectionTitle
          action={
            <Link
              href="/wox/supplier/analytics"
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              Revenue analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          Revenue
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Today" value={formatPrice(stats.revenue.today)} icon={IndianRupee} />
          <StatCard label="This week" value={formatPrice(stats.revenue.week)} icon={CalendarDays} />
          <StatCard label="This month" value={formatPrice(stats.revenue.month)} icon={TrendingUp} />
          <StatCard label="This year" value={formatPrice(stats.revenue.year)} icon={TrendingUp} />
          <StatCard
            label="Total revenue"
            value={formatPrice(stats.revenue.total)}
            icon={IndianRupee}
            hint="All time, own products only"
          />
        </div>
      </section>

      <section>
        <SectionTitle
          action={
            <Link
              href="/wox/supplier/orders"
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              View orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          Orders
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total orders" value={stats.orders.total} icon={ShoppingCart} />
          <StatCard label="Today's orders" value={stats.orders.today} icon={CalendarDays} />
          <StatCard label="Pending" value={stats.orders.pending} icon={Clock} tone="warning" />
          <StatCard label="Completed" value={stats.orders.completed} icon={CheckCircle2} tone="success" />
          <StatCard label="Cancelled" value={stats.orders.cancelled} icon={XCircle} tone="danger" />
        </div>
      </section>

      <section>
        <SectionTitle
          action={
            <Link
              href="/wox/supplier/products"
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              Manage products <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          Products
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Products listed" value={stats.products.listed} icon={Package} />
          <StatCard label="Active listings" value={stats.products.active} icon={Package} tone="success" />
          <StatCard
            label="Out of stock"
            value={stats.products.outOfStock}
            icon={AlertTriangle}
            tone={stats.products.outOfStock > 0 ? "danger" : "default"}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900">Revenue — last 7 days</h2>
          </div>
          <Link
            href="/wox/supplier/analytics"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
          >
            Open analytics
          </Link>
        </div>
        <RevenueChart
          points={stats.daily.map((day) => ({
            date: day.date,
            label: day.date.slice(8) + "/" + day.date.slice(5, 7),
            revenue: day.revenue,
            orders: day.orders,
            units: day.units,
          }))}
          height={150}
          emptyMessage="No sales in the last 7 days yet."
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">Recent Orders</h2>
            <Link
              href="/wox/supplier/orders"
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">No orders yet.</p>
          ) : (
            <ul className="divide-y">
              {stats.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">#{order.orderNumber}</p>
                    <p className="text-xs text-zinc-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : ""}
                      {" · "}
                      {order.units} item{order.units === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-900">
                      {formatPrice(order.supplierSubtotal)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">Recent Notifications</h2>
            <Link
              href="/wox/supplier/notifications"
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">
              No notifications yet — order and stock alerts appear here.
            </p>
          ) : (
            <ul className="divide-y">
              {notifications.slice(0, 5).map((n: SupplierNotification) => (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = n.url || "/wox/supplier/notifications";
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                  >
                    <Bell
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        n.type === "supplier_alert" ? "text-red-400" : "text-zinc-400"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm ${
                          n.read ? "font-normal text-zinc-600" : "font-medium text-zinc-900"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-zinc-500">{n.body}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-zinc-400">
                      {notificationTime(n.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
