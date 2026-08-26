"use client";

import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";

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
  return (
    <>
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
                  <td className="px-4 py-3 font-medium text-gray-900">{order.id}</td>
                  <td className="px-4 py-3 text-gray-600">{order.customer}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn(statusStyles[order.status])}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm font-medium", paymentStyles[order.payment])}>{order.payment}</span>
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
