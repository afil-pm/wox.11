"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeft,
  Menu,
  X,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", active: false },
  { label: "Products", icon: Package, href: "/admin/products", active: false },
  { label: "Orders", icon: ShoppingCart, href: "/admin/orders", active: true },
];

const statusStyles: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-cyan-100 text-cyan-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const paymentStyles: Record<string, string> = {
  Completed: "text-green-600",
  Pending: "text-yellow-600",
  Failed: "text-red-600",
  Refunded: "text-gray-600",
};

const orders = [
  { id: "WOX-784521", customer: "Rahul Sharma", date: "2026-08-20", total: 3497, status: "Shipped", payment: "Completed" },
  { id: "WOX-784520", customer: "Amit Patel", date: "2026-08-19", total: 1199, status: "Delivered", payment: "Completed" },
  { id: "WOX-784519", customer: "Vikram Singh", date: "2026-08-19", total: 2697, status: "Processing", payment: "Completed" },
  { id: "WOX-784518", customer: "Sanjay Mehta", date: "2026-08-18", total: 4298, status: "Processing", payment: "Completed" },
  { id: "WOX-784517", customer: "Deepak Kumar", date: "2026-08-18", total: 699, status: "Pending", payment: "Pending" },
  { id: "WOX-784516", customer: "Arjun Reddy", date: "2026-08-17", total: 3697, status: "Shipped", payment: "Completed" },
  { id: "WOX-784515", customer: "Karan Joshi", date: "2026-08-17", total: 899, status: "Cancelled", payment: "Refunded" },
  { id: "WOX-784514", customer: "Nikhil Gupta", date: "2026-08-16", total: 2796, status: "Delivered", payment: "Completed" },
];

export default function AdminOrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-zinc-900 text-white transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            WOX.11
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                item.active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Store
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-4 flex-1 lg:ml-0" />

          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
                A
              </div>
              <span className="hidden text-sm font-medium md:block">Admin</span>
              <ChevronDown className="hidden h-4 w-4 text-gray-500 md:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500">View and manage customer orders</p>
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.customer}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(order.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn(statusStyles[order.status])}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-sm font-medium", paymentStyles[order.payment])}>
                          {order.payment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
