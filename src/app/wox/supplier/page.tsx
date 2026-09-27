"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingCart, Clock, IndianRupee, ArrowRight } from "lucide-react";
import WoxLoader from "@/components/ui/wox-loader";
import { supplierFetch } from "@/lib/supplier-api";

interface MeResponse {
  supplier: {
    id: string;
    name: string;
    email: string;
    supplierName: string;
    status: "PENDING" | "ACTIVE" | "SUSPENDED";
    canUpdateOrderStatus: boolean;
  };
  stats: {
    totalProducts: number;
    activeProducts: number;
    orderCount: number;
    pendingOrders: number;
  };
}

interface SalesResponse {
  sales: {
    totals: { orders: number; units: number; revenue: number };
    products: { slug: string; name: string; units: number; revenue: number }[];
    daily: { date: string; units: number; revenue: number }[];
  };
}

interface SupplierOrder {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string | null;
  supplierSubtotal: number;
  units: number;
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

export default function SupplierDashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [sales, setSales] = useState<SalesResponse["sales"] | null>(null);
  const [recentOrders, setRecentOrders] = useState<SupplierOrder[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      supplierFetch("/api/wox/supplier/me").then((r) => r.json()),
      supplierFetch("/api/wox/supplier/sales?days=30").then((r) => r.json()),
      supplierFetch("/api/wox/supplier/orders?limit=5").then((r) => r.json()),
    ])
      .then(([meData, salesData, ordersData]) => {
        if (meData?.supplier) setMe(meData);
        if (salesData?.sales) setSales(salesData.sales);
        if (Array.isArray(ordersData?.orders)) setRecentOrders(ordersData.orders);
        if (meData?.error && !meData.supplier) setError(meData.error);
      })
      .catch(() => setError("Could not load the dashboard."));
  }, []);

  if (error) {
    return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  }

  if (!me) {
    return (
      <div className="flex h-64 items-center justify-center">
        <WoxLoader />
      </div>
    );
  }

  const stats = [
    { label: "Total Products", value: me.stats.totalProducts, icon: Package },
    { label: "Active Listings", value: me.stats.activeProducts, icon: Package },
    { label: "Orders", value: me.stats.orderCount, icon: ShoppingCart },
    { label: "Open Orders", value: me.stats.pendingOrders, icon: Clock },
    {
      label: "Revenue (30 days)",
      value: `₹${(sales?.totals.revenue ?? 0).toLocaleString("en-IN")}`,
      icon: IndianRupee,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          {me.supplier.supplierName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Here is what is happening with your listings.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {stat.label}
              </span>
              <stat.icon className="h-4 w-4 text-zinc-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

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
          {recentOrders.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">No orders yet.</p>
          ) : (
            <ul className="divide-y">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">#{order.orderNumber}</p>
                    <p className="text-xs text-zinc-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : ""}
                      {" · "}
                      {order.units} item{order.units === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-900">
                      ₹{order.supplierSubtotal.toLocaleString("en-IN")}
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
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">Top Products (30 days)</h2>
          </div>
          {!sales || sales.products.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">No sales in the last 30 days.</p>
          ) : (
            <ul className="divide-y">
              {sales.products.slice(0, 5).map((product) => (
                <li key={product.slug} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{product.name}</p>
                    <p className="text-xs text-zinc-500">{product.units} units sold</p>
                  </div>
                  <span className="text-sm font-medium text-zinc-900">
                    ₹{product.revenue.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
