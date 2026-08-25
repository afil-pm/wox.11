"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeft,
  TrendingUp,
  Plus,
  Eye,
  Menu,
  X,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", active: true },
  { label: "Products", icon: Package, href: "/admin/products", active: false },
  { label: "Orders", icon: ShoppingCart, href: "/admin/orders", active: false },
];

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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, here&apos;s what&apos;s happening today.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <stat.icon className="h-5 w-5 text-gray-400" />
                </div>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Recent Orders
            </h2>
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
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {order.customer}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {order.date}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {formatPrice(order.amount)}
                      </td>
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
        </main>
      </div>
    </div>
  );
}
