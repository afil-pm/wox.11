"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, ArrowLeft, Eye, XCircle, RotateCcw, Truck, CheckCircle2, Clock, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import WoxLoader from "@/components/ui/wox-loader";

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
  status: string;
  paymentMethod: string;
  paymentId: string;
  paymentStatus: string;
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

const statusLabels: Record<string, string> = {
  PENDING: "Order Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Return Requested",
};

const trackingSteps = [
  { key: "PENDING", label: "Order Placed", icon: Clock },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { key: "PROCESSING", label: "Processing", icon: Box },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

const cancelableStatuses = ["PENDING", "CONFIRMED"];
const returnableStatuses = ["DELIVERED"];

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const stored = localStorage.getItem("wox-user");
      if (!stored) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const user = JSON.parse(stored);
      const res = await fetch("/api/mongo/orders");
      const data = await res.json();
      const allOrders: Order[] = data.orders || [];

      const userEmail = (user.email || "").toLowerCase().trim();
      const userName = (user.name || "").toLowerCase().trim();

      const myOrders = allOrders.filter((o) => {
        const orderEmail = (o.customerEmail || "").toLowerCase().trim();
        const orderName = (o.customerName || "").toLowerCase().trim();
        const orderPhone = (o.customerPhone || "").trim();

        if (userEmail && orderEmail && orderEmail === userEmail) return true;
        if (userName && orderName && orderName === userName) return true;
        if (orderPhone && o.address?.phone && orderPhone === o.address.phone) return true;
        if (userEmail && orderEmail === "") {
          if (userName && orderName === userName) return true;
        }
        return false;
      });

      setOrders(myOrders);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        modalScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
      });
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedOrder]);

  async function handleCancelOrder(orderId: string) {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setActionLoading(orderId);
    try {
      await fetch(`/api/mongo/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      await fetchOrders();
      setSelectedOrder(null);
    } catch {
      alert("Failed to cancel order");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReturnOrder(orderId: string) {
    if (!confirm("Are you sure you want to request a return?")) return;
    setActionLoading(orderId);
    try {
      await fetch(`/api/mongo/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RETURNED" }),
      });
      await fetchOrders();
      setSelectedOrder(null);
    } catch {
      alert("Failed to request return");
    } finally {
      setActionLoading(null);
    }
  }

  function getTrackingIndex(status: string): number {
    const idx = trackingSteps.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <WoxLoader />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/account" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-zinc-300" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900">No orders yet</h2>
          <p className="mt-2 text-sm text-zinc-500">Start shopping to see your orders here.</p>
          <Link href="/" className="mt-6 inline-block">
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-900">{order.orderNumber}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={cn(statusStyles[order.status] || "bg-gray-100 text-gray-800")}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                  <span className="font-semibold text-zinc-900">{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Mini Tracking */}
              {order.status !== "CANCELLED" && order.status !== "RETURNED" && (
                <div className="mt-4 flex items-center gap-1">
                  {trackingSteps.map((step, i) => {
                    const currentIdx = getTrackingIndex(order.status);
                    const isCompleted = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step.key} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold",
                              isCompleted
                                ? "bg-zinc-900 text-white"
                                : isCurrent
                                  ? "bg-zinc-900 text-white ring-2 ring-zinc-200"
                                  : "bg-zinc-200 text-zinc-500"
                            )}
                          >
                            <step.icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="mt-1 text-[9px] text-zinc-500 hidden sm:block">
                            {step.label}
                          </span>
                        </div>
                        {i < trackingSteps.length - 1 && (
                          <div
                            className={cn(
                              "mx-1 h-0.5 flex-1",
                              i < currentIdx ? "bg-zinc-900" : "bg-zinc-200"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {order.status === "CANCELLED" && (
                <div className="mt-3 rounded-lg bg-red-50 p-2 text-center text-xs font-medium text-red-600">
                  This order has been cancelled
                </div>
              )}
              {order.status === "RETURNED" && (
                <div className="mt-3 rounded-lg bg-orange-50 p-2 text-center text-xs font-medium text-orange-600">
                  Return request submitted — our team will contact you
                </div>
              )}

              {/* Items Preview */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="relative h-10 w-10 overflow-hidden rounded-lg border-2 border-white bg-zinc-100">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[8px] text-zinc-400">N/A</div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-zinc-500">
                  {order.items.length} item(s) &middot; {order.paymentMethod.toUpperCase()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(order)}
                  className="ml-auto"
                >
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            ref={modalScrollRef}
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-xl"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">{selectedOrder.orderNumber}</h2>
                <p className="text-xs text-zinc-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-zinc-400 hover:text-zinc-600 text-xl">
                &times;
              </button>
            </div>

            {/* Status */}
            <div className="mt-4 flex items-center gap-3">
              <Badge className={cn(statusStyles[selectedOrder.status])}>
                {statusLabels[selectedOrder.status]}
              </Badge>
              <span className="text-sm text-zinc-500">
                Payment: {selectedOrder.paymentMethod.toUpperCase()} ({selectedOrder.paymentStatus})
              </span>
            </div>

            {/* Tracking */}
            {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "RETURNED" && (
              <div className="mt-5 rounded-xl bg-zinc-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900">Order Tracking</h3>
                <div className="flex items-center gap-1">
                  {trackingSteps.map((step, i) => {
                    const currentIdx = getTrackingIndex(selectedOrder.status);
                    const isCompleted = i <= currentIdx;
                    return (
                      <div key={step.key} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full",
                              isCompleted ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-400"
                            )}
                          >
                            <step.icon className="h-4 w-4" />
                          </div>
                          <span className="mt-1 text-[10px] text-zinc-500">{step.label}</span>
                        </div>
                        {i < trackingSteps.length - 1 && (
                          <div className={cn("mx-1 h-0.5 flex-1", i < currentIdx ? "bg-zinc-900" : "bg-zinc-200")} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-zinc-900">Items</h3>
              <div className="mt-3 space-y-3">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-zinc-500">Size: {item.size} &middot; Qty: {item.quantity}</p>
                      <p className="text-xs text-zinc-500">{formatPrice(item.price)} each</p>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm">
              <h3 className="font-semibold text-zinc-900">Delivery Address</h3>
              <p className="mt-1 text-zinc-600">{selectedOrder.address?.line1}</p>
              <p className="text-zinc-600">
                {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}
              </p>
            </div>

            {/* Price Summary */}
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Subtotal</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Shipping</span><span>{selectedOrder.shippingCost === 0 ? "Free" : formatPrice(selectedOrder.shippingCost)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Tax</span><span>{formatPrice(selectedOrder.tax)}</span></div>
              <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatPrice(selectedOrder.total)}</span></div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-2 border-t pt-4 pb-2">
              {cancelableStatuses.includes(selectedOrder.status) && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={actionLoading === selectedOrder._id}
                  onClick={() => handleCancelOrder(selectedOrder._id)}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  {actionLoading === selectedOrder._id ? "Cancelling..." : "Cancel Order"}
                </Button>
              )}
              {returnableStatuses.includes(selectedOrder.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  disabled={actionLoading === selectedOrder._id}
                  onClick={() => handleReturnOrder(selectedOrder._id)}
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  {actionLoading === selectedOrder._id ? "Processing..." : "Request Return"}
                </Button>
              )}
            </div>
            </div>
           </div>
         </div>
       )}
     </div>
   );
}
