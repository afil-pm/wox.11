"use client";

import { useEffect, useState, useCallback } from "react";
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
    taluk: string;
    district: string;
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

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const stored = localStorage.getItem("wox-user");
      if (!stored) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const user = JSON.parse(stored);
      if (!user?.id) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const res = await fetch("/api/mongo/orders", {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
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
            <Link
              key={order._id}
              href={`/account/orders/${order._id}`}
              className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-zinc-300"
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
                <span className="ml-auto flex items-center gap-1 text-xs font-medium text-zinc-600">
                  View Details
                  <Eye className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
