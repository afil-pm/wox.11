"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  Eye,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { adminFetch } from "@/lib/admin-api";
import WoxLoader from "@/components/ui/wox-loader";

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminFetch("/api/mongo/orders?limit=50");
      const data = await res.json();
      const allOrders: Order[] = data.orders || [];

      setOrders(allOrders.slice(0, 5));

      const totalRevenue = allOrders.reduce(
        (sum: number, o: Order) =>
          o.status !== "CANCELLED" ? sum + o.total : sum,
        0
      );
      const pendingOrders = allOrders.filter(
        (o: Order) => o.status === "PENDING"
      ).length;

      setStats({
        totalOrders: data.total || allOrders.length,
        totalRevenue,
        pendingOrders,
      });
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleSeed() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await adminFetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSeedResult(data.message);
      } else {
        setSeedResult(data.error || "Seed failed");
      }
    } catch {
      setSeedResult("Seed request failed");
    } finally {
      setSeeding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <WoxLoader />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, here&apos;s what&apos;s happening today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Orders</p>
            <ShoppingCart className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats.totalOrders}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Revenue</p>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatPrice(stats.totalRevenue)}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pending Orders</p>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats.pendingOrders}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Link href="/admin/products/new">
          <Button className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
        <Link href="/admin/products">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Package className="h-4 w-4" />
            View Products
          </Button>
        </Link>
        <Link href="/admin/orders">
          <Button variant="outline" className="w-full justify-start gap-2">
            <ShoppingCart className="h-4 w-4" />
            View Orders
          </Button>
        </Link>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleSeed}
          disabled={seeding}
        >
          <Database className="h-4 w-4" />
          {seeding ? "Seeding..." : "Seed Products to DB"}
        </Button>
      </div>
      {seedResult && (
        <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{seedResult}</div>
      )}

      <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Orders
        </h2>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No orders yet. Orders will appear here when customers place them.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pr-4">Order #</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="pb-3 pr-4 font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="pb-3 pr-4 text-gray-600">
                      {order.customerName}
                    </td>
                    <td className="pb-3 pr-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="pb-3 pr-4 font-medium text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="pb-3 pr-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          statusStyles[order.status] ||
                            "bg-gray-100 text-gray-800"
                        )}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="pb-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/orders">
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
