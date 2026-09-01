"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";
import { Eye, IndianRupee, TrendingUp, Calendar, BarChart3, BadgeCheck, Banknote, Check, X, Loader2 } from "lucide-react";
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
  taxDetails?: {
    totalTaxableAmount: number;
    totalGstAmount: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    isInterState: boolean;
  };
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

interface RefundRequest {
  _id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  type: "cancel_refund" | "return_refund";
  reason: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "processed" | "completed";
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId: string;
  };
  adminNotes: string;
  refundTransactionId: string;
  refundReferenceNumber: string;
  paymentMethod: string;
  paymentId: string;
  processedAt?: string;
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
  REFUNDED: "bg-gray-100 text-gray-800",
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
  REFUNDED: "Refunded",
};

const nextStatuses: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "RETURNED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

const refundStatusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  processed: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
};

const refundStatusLabels: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  processed: "Refund Processing",
  completed: "Completed",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const modalRef = useRef<HTMLDivElement>(null);

  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [refundActionLoading, setRefundActionLoading] = useState(false);
  const [refundAdminNotes, setRefundAdminNotes] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const [showBankDetails, setShowBankDetails] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await adminFetch("/api/mongo/orders");
      const data = await res.json();
      setOrders(data.orders || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRefundRequests = useCallback(async () => {
    try {
      const res = await adminFetch("/api/refund-requests");
      const data = await res.json();
      setRefundRequests(data.refundRequests || []);
    } catch (e) {
      console.error("Failed to fetch refund requests:", e);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchRefundRequests();
    const interval = setInterval(() => {
      fetchOrders();
      fetchRefundRequests();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchRefundRequests]);

  useEffect(() => {
    if (selectedOrder || selectedRefund) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => modalRef.current?.scrollTo({ top: 0, behavior: "auto" }));
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedOrder, selectedRefund]);

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

  async function handleRefundAction(refundId: string, action: "approve" | "reject" | "process" | "complete") {
    setRefundActionLoading(true);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "reject" && !refundAdminNotes.trim()) {
        alert("Admin notes are required when rejecting a refund");
        setRefundActionLoading(false);
        return;
      }
      if (refundAdminNotes.trim()) body.adminNotes = refundAdminNotes;
      if (action === "process" && refundReference.trim()) body.refundReferenceNumber = refundReference;

      await adminFetch(`/api/wox/admin/refund-requests/${refundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setSelectedRefund(null);
      setRefundAdminNotes("");
      setRefundReference("");
      fetchRefundRequests();
      fetchOrders();
    } catch (e) {
      console.error("Failed to process refund:", e);
      alert("Failed to process refund request");
    } finally {
      setRefundActionLoading(false);
    }
  }

  const revenueOrders = orders;
  const totalRevenue = revenueOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const paidRevenue = revenueOrders
    .filter((o) => o.paymentStatus === "PAID" || o.paymentStatus === "COMPLETED")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingRevenue = revenueOrders
    .filter((o) => o.paymentStatus === "PENDING")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrdersCount = revenueOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const pendingRefunds = refundRequests.filter((r) => r.status === "pending").length;

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
        <div />
      </div>

      {/* Revenue Dashboard */}
      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Revenue Overview</h2>
          </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
          <div className="rounded-lg bg-orange-50 p-3">
            <div className="flex items-center gap-1.5 text-orange-600">
              <Banknote className="h-3.5 w-3.5" />
              <span className="text-xs">Refund Requests</span>
            </div>
            <p className="mt-1 text-lg font-bold text-orange-700">{pendingRefunds}</p>
          </div>
        </div>
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

      {/* Refund Requests Section */}
      <div className="mt-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Refund Requests</h2>
          {pendingRefunds > 0 && (
            <Badge className="bg-orange-100 text-orange-800">{pendingRefunds} pending</Badge>
          )}
        </div>
        {refundRequests.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">No refund requests found</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {refundRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {req.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{req.customerName}</div>
                        <div className="text-xs text-gray-500">{req.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {req.type === "cancel_refund" ? "Cancel & Refund" : "Return & Refund"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatPrice(req.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn(refundStatusStyles[req.status])}>
                          {refundStatusLabels[req.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRefund(req);
                            setRefundAdminNotes(req.adminNotes || "");
                            setRefundReference(req.refundReferenceNumber || "");
                          }}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
              {selectedOrder.taxDetails && selectedOrder.taxDetails.totalTaxableAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxable Amount</span>
                  <span>{formatPrice(selectedOrder.taxDetails.totalTaxableAmount)}</span>
                </div>
              )}
              {selectedOrder.taxDetails && selectedOrder.taxDetails.totalGstAmount > 0 && (
                <>
                  {selectedOrder.taxDetails.isInterState ? (
                    <div className="flex justify-between">
                      <span className="text-gray-500">IGST</span>
                      <span>{formatPrice(selectedOrder.taxDetails.totalGstAmount)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">CGST</span>
                        <span>{formatPrice(selectedOrder.taxDetails.totalCgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">SGST</span>
                        <span>{formatPrice(selectedOrder.taxDetails.totalSgst)}</span>
                      </div>
                    </>
                  )}
                </>
              )}
              {!selectedOrder.taxDetails && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax (GST)</span>
                  <span>{formatPrice(selectedOrder.tax)}</span>
                </div>
              )}
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
                        await adminFetch(`/api/wox/admin/orders/${selectedOrder._id}/confirm-cod`, {
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

      {/* Refund Request Detail Modal */}
      {selectedRefund && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:p-4"
          onClick={() => { setSelectedRefund(null); setRefundAdminNotes(""); setRefundReference(""); }}
        >
          <div
            ref={modalRef}
            className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-xl bg-white shadow-xl"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Refund Request</h2>
                <p className="text-xs text-gray-500">Order {selectedRefund.orderNumber}</p>
              </div>
              <button
                onClick={() => { setSelectedRefund(null); setRefundAdminNotes(""); setRefundReference(""); }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium text-gray-900">{selectedRefund.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900">{selectedRefund.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="text-gray-900">{selectedRefund.type === "cancel_refund" ? "Cancel & Refund" : "Return & Refund"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Refund Amount</span>
                <span className="font-bold text-gray-900">{formatPrice(selectedRefund.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method</span>
                <span className="text-gray-900">{selectedRefund.paymentMethod.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge className={cn(refundStatusStyles[selectedRefund.status])}>
                  {refundStatusLabels[selectedRefund.status]}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Reason:</span>
                <p className="mt-1 text-gray-900">{selectedRefund.reason}</p>
              </div>
            </div>

            {/* Bank Details */}
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-amber-800">Bank Details for Refund</h4>
                <button
                  onClick={() => setShowBankDetails(showBankDetails === selectedRefund._id ? null : selectedRefund._id)}
                  className="text-xs text-amber-700 underline"
                >
                  {showBankDetails === selectedRefund._id ? "Hide" : "Show"}
                </button>
              </div>
              {showBankDetails === selectedRefund._id ? (
                <div className="space-y-1 text-amber-900">
                  <p><span className="font-medium">Account Holder:</span> {selectedRefund.bankDetails.accountHolderName}</p>
                  <p><span className="font-medium">Account Number:</span> {selectedRefund.bankDetails.accountNumber}</p>
                  <p><span className="font-medium">IFSC:</span> {selectedRefund.bankDetails.ifscCode}</p>
                  <p><span className="font-medium">Bank:</span> {selectedRefund.bankDetails.bankName}</p>
                  {selectedRefund.bankDetails.upiId && (
                    <p><span className="font-medium">UPI:</span> {selectedRefund.bankDetails.upiId}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-amber-700">Click &quot;Show&quot; to reveal sensitive bank details</p>
              )}
            </div>

            {selectedRefund.refundTransactionId && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                <p className="font-medium text-green-800">Refund Transaction ID: {selectedRefund.refundTransactionId}</p>
                {selectedRefund.refundReferenceNumber && (
                  <p className="text-green-700">Reference: {selectedRefund.refundReferenceNumber}</p>
                )}
              </div>
            )}

            {/* Admin Actions */}
            {selectedRefund.status === "pending" && (
              <div className="mt-4 border-t pt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Admin Notes</label>
                  <textarea
                    value={refundAdminNotes}
                    onChange={(e) => setRefundAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Add notes (required for rejection)..."
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700 gap-1.5"
                    disabled={refundActionLoading}
                    onClick={() => handleRefundAction(selectedRefund._id, "approve")}
                  >
                    {refundActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={refundActionLoading}
                    onClick={() => handleRefundAction(selectedRefund._id, "reject")}
                  >
                    {refundActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {selectedRefund.status === "approved" && (
              <div className="mt-4 border-t pt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Refund Reference Number (optional)</label>
                  <Input
                    type="text"
                    value={refundReference}
                    onChange={(e) => setRefundReference(e.target.value)}
                    placeholder="Bank/UTR reference number"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Admin Notes (optional)</label>
                  <textarea
                    value={refundAdminNotes}
                    onChange={(e) => setRefundAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Processing notes..."
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 gap-1.5"
                  disabled={refundActionLoading}
                  onClick={() => handleRefundAction(selectedRefund._id, "process")}
                >
                  {refundActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Banknote className="h-3.5 w-3.5" />}
                  Process Refund (via Razorpay)
                </Button>
              </div>
            )}

            {selectedRefund.status === "processed" && (
              <div className="mt-4 border-t pt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Admin Notes (optional)</label>
                  <textarea
                    value={refundAdminNotes}
                    onChange={(e) => setRefundAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Completion notes..."
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700 gap-1.5"
                  disabled={refundActionLoading}
                  onClick={() => handleRefundAction(selectedRefund._id, "complete")}
                >
                  {refundActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Mark as Completed
                </Button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
