"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, XCircle, RotateCcw, Truck, CheckCircle2, Clock, Box } from "lucide-react";
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
    taluk: string;
    district: string;
    state: string;
    pincode: string;
    landmark: string;
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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const stored = localStorage.getItem("wox-user");
        const user = stored ? JSON.parse(stored) : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (user?.id) headers["x-user-id"] = user.id;

        const res = await fetch(`/api/mongo/orders/${id}`, { headers });
        if (!res.ok) {
          setOrder(null);
          return;
        }
        const data = await res.json();
        setOrder(data.order || null);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  async function handleCancelOrder() {
    if (!order) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setActionLoading(true);
    try {
      const stored = localStorage.getItem("wox-user");
      const user = stored ? JSON.parse(stored) : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user?.id) headers["x-user-id"] = user.id;

      await fetch(`/api/mongo/orders/${order._id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      setOrder((prev) => prev ? { ...prev, status: "CANCELLED" } : null);
    } catch {
      alert("Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReturnOrder() {
    if (!order) return;
    if (!confirm("Are you sure you want to request a return?")) return;
    setActionLoading(true);
    try {
      const stored = localStorage.getItem("wox-user");
      const user = stored ? JSON.parse(stored) : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user?.id) headers["x-user-id"] = user.id;

      await fetch(`/api/mongo/orders/${order._id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "RETURNED" }),
      });
      setOrder((prev) => prev ? { ...prev, status: "RETURNED" } : null);
    } catch {
      alert("Failed to request return");
    } finally {
      setActionLoading(false);
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

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/account/orders" className="text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Order Not Found</h1>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-zinc-500">This order doesn&apos;t exist or you don&apos;t have access.</p>
          <Link href="/account/orders" className="mt-4 inline-block">
            <Button variant="outline">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/account/orders" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{order.orderNumber}</h1>
          <p className="text-xs text-zinc-500">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Status & Payment */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <Badge className={cn(statusStyles[order.status])}>
          {statusLabels[order.status]}
        </Badge>
        <span className="text-sm text-zinc-500">
          Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})
        </span>
        <span className="ml-auto text-lg font-bold text-zinc-900">{formatPrice(order.total)}</span>
      </div>

      {/* Tracking */}
      {order.status !== "CANCELLED" && order.status !== "RETURNED" && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Order Tracking</h2>
          <div className="flex items-center gap-1">
            {trackingSteps.map((step, i) => {
              const currentIdx = getTrackingIndex(order.status);
              const isCompleted = i <= currentIdx;
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        isCompleted ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-400"
                      )}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="mt-2 text-[10px] font-medium text-zinc-500">{step.label}</span>
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

      {order.status === "CANCELLED" && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm font-medium text-red-600">
          This order has been cancelled
        </div>
      )}
      {order.status === "RETURNED" && (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-center text-sm font-medium text-orange-600">
          Return request submitted — our team will contact you
        </div>
      )}

      {/* Items */}
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Items ({order.items.length})</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-zinc-100 p-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">No Image</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 line-clamp-1">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">Size: {item.size} · Qty: {item.quantity}</p>
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
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">Delivery Address</h2>
        <p className="text-sm text-zinc-600">{order.address?.line1}</p>
        {order.address?.line2 && <p className="text-sm text-zinc-600">{order.address.line2}</p>}
        <p className="text-sm text-zinc-600">
          {order.address?.city}{order.address?.taluk ? `, ${order.address.taluk}` : ""}{order.address?.district ? `, ${order.address.district}` : ""} — {order.address?.state} - {order.address?.pincode}
        </p>
      </div>

      {/* Price Summary */}
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Price Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-zinc-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Shipping</span><span>{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Tax</span><span>{formatPrice(order.tax)}</span></div>
          <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </div>

      {/* Actions */}
      {(cancelableStatuses.includes(order.status) || returnableStatuses.includes(order.status)) && (
        <div className="mt-4 flex flex-wrap gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          {cancelableStatuses.includes(order.status) && (
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={handleCancelOrder}
            >
              <XCircle className="mr-1 h-4 w-4" />
              {actionLoading ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}
          {returnableStatuses.includes(order.status) && (
            <Button
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
              disabled={actionLoading}
              onClick={handleReturnOrder}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              {actionLoading ? "Processing..." : "Request Return"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
