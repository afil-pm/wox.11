"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";
import { RefreshCw, Eye, Trash2, Lock, IndianRupee, TrendingUp, Calendar, BarChart3, BadgeCheck } from "lucide-react";
import WoxLoader from "@/components/ui/wox-loader";
import { adminFetch } from "@/lib/admin-api";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  slug: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: {
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  PACKED: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  OUT_FOR_DELIVERY: "bg-teal-100 text-teal-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RETURNED: "bg-orange-100 text-orange-800",
};

const paymentStyles: Record<string, string> = {
  PAID: "text-green-600",
  COMPLETED: "text-green-600",
  PENDING: "text-yellow-600",
  FAILED: "text-red-600",
  REFUNDED: "text-gray-600",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

const nextStatuses: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPassword, setClearPassword] = useState("");
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState("");
  const [revenuePeriod, setRevenuePeriod] = useState<"today" | "7d" | "30d" | "all">("all");
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const url =
        filter === "ALL"
          ? "/api/mongo/orders"
          : `/api/mongo/orders?status=${filter}`;
      const res = await adminFetch(url);
      const data = await res.json();
      setOrders(data.orders || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => modalRef.current?.scrollTo({ top: 0, behavior: "auto" }));
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedOrder]);

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      await adminFetch(`/api/mongo/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }
    } catch (e) {
      console.error("Failed to update order:", e);
    }
  }

  async function handleClearOrders() {
    setClearLoading(true);
    setClearError("");
    try {
      const res = await fetch("/api/mongo/orders/clear", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: clearPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClearError(data.error || "Failed to clear orders");
        return;
      }
      setShowClearModal(false);
      setClearPassword("");
      setOrders([]);
      setSelectedOrder(null);
    } catch {
      setClearError("Network error. Please try again.");
    } finally {
      setClearLoading(false);
    }
  }

  function getFilteredRevenueOrders() {
    const now = new Date();
    if (revenuePeriod === "all") return orders;
    const cutoff = new Date(now);
    if (revenuePeriod === "today") {
      cutoff.setHours(0, 0, 0, 0);
    } else if (revenuePeriod === "7d") {
      cutoff.setDate(now.getDate() - 7);
    } else if (revenuePeriod === "30d") {
      cutoff.setDate(now.getDate() - 30);
    }
    return orders.filter((o) => new Date(o.createdAt) >= cutoff);
  }

  const revenueOrders = getFilteredRevenueOrders();
  const totalRevenue = revenueOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const paidRevenue = revenueOrders
    .filter((o) => o.paymentStatus === "PAID" || o.paymentStatus === "COMPLETED")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingRevenue = revenueOrders
    .filter((o) => o.paymentStatus === "PENDING")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrdersCount = revenueOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  const revenuePeriods = [
    { key: "today" as const, label: "Today" },
    { key: "7d" as const, label: "7 Days" },
    { key: "30d" as const, label: "30 Days" },
    { key: "all" as const, label: "All Time" },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">
            {orders.length} order(s) &middot; Updated{" "}
            {lastUpdated.toLocaleTimeString("en-IN")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { setShowClearModal(true); setClearError(""); }}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </Button>
        </div>
      </div>

      {/* Revenue Dashboard */}
      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Revenue Overview</h2>
          </div>
          <div className="flex gap-1">
            {revenuePeriods.map((p) => (
              <button
                key={p.key}
                onClick={() => setRevenuePeriod(p.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  revenuePeriod === p.key
                    ? "bg-zinc-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-zinc-50 p-3">
            <div className="flex items-center gap-1.5 text-gray-500">
              <IndianRupee className="h-3.5 w-3.5" />
              <span className="text-xs">Total Revenue</span>
            </div>
            <p className="mt-1 text-lg font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
            <p className="text-[11px] text-gray-400">{totalOrdersCount} orders</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <div className="flex items-center gap-1.5 text-green-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs">Paid</span>
            </div>
            <p className="mt-1 text-lg font-bold text-green-700">{formatPrice(paidRevenue)}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3">
            <div className="flex items-center gap-1.5 text-yellow-600">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">Pending</span>
            </div>
            <p className="mt-1 text-lg font-bold text-yellow-700">{formatPrice(pendingRevenue)}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="flex items-center gap-1.5 text-blue-600">
              <IndianRupee className="h-3.5 w-3.5" />
              <span className="text-xs">Avg. Order</span>
            </div>
            <p className="mt-1 text-lg font-bold text-blue-700">{formatPrice(avgOrderValue)}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                filter === s
                  ? "bg-zinc-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s === "ALL" ? "All" : statusLabels[s] || s}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <WoxLoader />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{order.customerName}</div>
                      <div className="text-xs text-gray-500">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.items.length} item(s)
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          statusStyles[order.status] || "bg-gray-100 text-gray-800"
                        )}
                      >
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          paymentStyles[order.paymentStatus] || "text-gray-600"
                        )}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            ref={modalRef}
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-y-auto overscroll-contain rounded-xl bg-white shadow-xl"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-gray-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <span className="font-medium text-gray-700">Customer:</span>
                  <p className="text-gray-900">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p className="text-gray-900">{selectedOrder.customerPhone}</p>
                </div>
                {selectedOrder.customerEmail && (
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-900">{selectedOrder.customerEmail}</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="font-medium text-gray-700">Address:</span>
                  <p className="text-gray-900">
                    {selectedOrder.address.line1}
                    {selectedOrder.address.line2 ? `, ${selectedOrder.address.line2}` : ""}
                  </p>
                  <p className="text-gray-900">
                    {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium text-gray-700">
                Items ({selectedOrder.items.length})
              </h3>
              <div className="mt-3 space-y-3">
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-lg border border-gray-100 p-3"
                  >
                    {item.image ? (
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                        No Image
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Size: {item.size} &middot; Qty: {item.quantity}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{selectedOrder.shippingCost === 0 ? "Free" : formatPrice(selectedOrder.shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (GST 18%)</span>
                <span>{formatPrice(selectedOrder.tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Status:</span>
                <Badge className={cn(statusStyles[selectedOrder.status] || "bg-gray-100 text-gray-800")}>
                  {statusLabels[selectedOrder.status] || selectedOrder.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Payment:</span>
                <span className={cn("text-sm font-medium", paymentStyles[selectedOrder.paymentStatus])}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
            </div>

            {selectedOrder.paymentMethod === "cod" && selectedOrder.paymentStatus === "PENDING" && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-800">COD Payment Pending</p>
                    <p className="text-xs text-amber-600">Confirm once you&apos;ve received the cash from customer</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700 gap-1.5"
                    onClick={async () => {
                      try {
                        await adminFetch(`/api/admin/orders/${selectedOrder._id}/confirm-cod`, {
                          method: "POST",
                        });
                        setSelectedOrder((prev) =>
                          prev ? { ...prev, paymentStatus: "PAID" } : null
                        );
                        fetchOrders();
                      } catch (e) {
                        console.error("Failed to confirm COD:", e);
                        alert("Failed to confirm payment");
                      }
                    }}
                  >
                    <BadgeCheck className="h-4 w-4" />
                    Confirm Payment
                  </Button>
                </div>
              </div>
            )}
            {selectedOrder.paymentMethod === "cod" && selectedOrder.paymentStatus === "PAID" && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800">COD Payment Confirmed</p>
                </div>
              </div>
            )}

            {nextStatuses[selectedOrder.status]?.length > 0 && (
              <div className="mt-4 border-t pt-4 pb-2">
                {selectedOrder.status === "PENDING" && (
                  <p className="mb-3 text-xs text-gray-500">
                    Review the order above, then approve or cancel.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {nextStatuses[selectedOrder.status].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={s === "CANCELLED" ? "destructive" : "default"}
                      className={s === "CONFIRMED" ? "bg-green-600 text-white hover:bg-green-700" : ""}
                      onClick={() => updateOrderStatus(selectedOrder._id, s)}
                    >
                      {selectedOrder.status === "PENDING" && s === "CONFIRMED"
                        ? "Approve Order"
                        : statusLabels[s] || s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Clear History Password Modal */}
      {showClearModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setShowClearModal(false); setClearPassword(""); setClearError(""); }}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Clear Order History</h3>
                <p className="text-xs text-red-500">This cannot be undone</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              This will permanently delete all {orders.length} orders. Users will see an empty order history. Enter password to confirm.
            </p>

            <div className="mt-4">
              <Input
                type="password"
                value={clearPassword}
                onChange={(e) => setClearPassword(e.target.value)}
                placeholder="Enter admin password"
                onKeyDown={(e) => { if (e.key === "Enter" && clearPassword) handleClearOrders(); }}
              />
              {clearError && (
                <p className="mt-2 text-xs text-red-500">{clearError}</p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowClearModal(false); setClearPassword(""); setClearError(""); }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!clearPassword || clearLoading}
                onClick={handleClearOrders}
              >
                {clearLoading ? "Deleting..." : "Delete All Orders"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
