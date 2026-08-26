"use client";

import Link from "next/link";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

const stats = [
  { label: "Total Products", value: "156", icon: Package },
  { label: "Total Orders", value: "1,247", icon: ShoppingCart },
  { label: "Revenue", value: "₹12,45,680", icon: TrendingUp },
];

const recentOrders = [
  { id: "ORD-7891", customer: "Ananya Sharma", date: "2026-08-25", amount: 4599, status: "Processing", color: "bg-yellow-100 text-yellow-800" },
  { id: "ORD-7890", customer: "Rohan Gupta", date: "2026-08-25", amount: 2899, status: "Shipped", color: "bg-blue-100 text-blue-800" },
  { id: "ORD-7889", customer: "Priya Patel", date: "2026-08-24", amount: 8999, status: "Delivered", color: "bg-green-100 text-green-800" },
  { id: "ORD-7888", customer: "Vikram Singh", date: "2026-08-24", amount: 1599, status: "Processing", color: "bg-yellow-100 text-yellow-800" },
  { id: "ORD-7887", customer: "Meera Joshi", date: "2026-08-23", amount: 6799, status: "Cancelled", color: "bg-red-100 text-red-800" },
];

export default function AdminDashboard() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <stat.icon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
      </div>

      <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                <th className="pb-3 pr-4">Order ID</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-900">{order.id}</td>
                  <td className="py-3 pr-4 text-gray-600">{order.customer}</td>
                  <td className="py-3 pr-4 text-gray-500">{order.date}</td>
                  <td className="py-3 pr-4 font-medium text-gray-900">{formatPrice(order.amount)}</td>
                  <td className="py-3 pr-4">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", order.color)}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3">
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
      </div>
    </>
  );
}
