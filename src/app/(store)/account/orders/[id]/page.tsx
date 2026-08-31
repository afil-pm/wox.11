"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, XCircle, RotateCcw, Truck, CheckCircle2, Clock, Box, Star, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  taxDetails?: {
    totalTaxableAmount: number;
    totalGstAmount: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    isInterState: boolean;
  };
  status: string;
  paymentMethod: string;
  paymentId: string;
  paymentStatus: string;
  deliveredAt?: string;
  createdAt: string;
}

interface RefundRequestInfo {
  _id: string;
  status: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
}

interface SavedBankInfo {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId: string;
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
  REFUNDED: "Refunded",
};

const refundStatusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  processed: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
};

const refundStatusLabels: Record<string, string> = {
  pending: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  processed: "Refund Processing",
  completed: "Refund Completed",
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
  const [reviewItem, setReviewItem] = useState<OrderItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewedSlugs, setReviewedSlugs] = useState<Set<string>>(new Set());

  const [refundModal, setRefundModal] = useState<"cancel_refund" | "return_refund" | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundBankDetails, setRefundBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  });
  const [saveBankDetails, setSaveBankDetails] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [savedBank, setSavedBank] = useState<SavedBankInfo | null>(null);
  const [useSavedBank, setUseSavedBank] = useState(false);
  const [existingRefund, setExistingRefund] = useState<RefundRequestInfo | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const stored = localStorage.getItem("wox-user");
        const user = stored ? JSON.parse(stored) : null;
        const userId = user?.id || localStorage.getItem("wox-user-id") || "";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (userId) headers["x-user-id"] = userId;

        const res = await fetch(`/api/mongo/orders/${id}`, { headers });
        if (!res.ok) {
          setOrder(null);
          return;
        }
        const data = await res.json();
        setOrder(data.order || null);

        if (userId) {
          const refundRes = await fetch("/api/refund-requests", { headers });
          if (refundRes.ok) {
            const refundData = await refundRes.json();
            const orderRefund = (refundData.refundRequests || []).find(
              (r: RefundRequestInfo) => r._id && refundData.refundRequests.indexOf(r) >= 0
            );
            const thisOrderRefund = (refundData.refundRequests || []).find(
              (r: RefundRequestInfo) => r.status !== "rejected"
            );
            if (thisOrderRefund) setExistingRefund(thisOrderRefund);
          }

          const bankRes = await fetch("/api/saved-bank-details", { headers });
          if (bankRes.ok) {
            const bankData = await bankRes.json();
            if (bankData.bankDetails) {
              setSavedBank(bankData.bankDetails);
            }
          }
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  async function fetchRefundStatus() {
    try {
      const stored = localStorage.getItem("wox-user");
      const user = stored ? JSON.parse(stored) : null;
      const userId = user?.id || "";
      if (!userId || !order) return;
      const headers: Record<string, string> = { "Content-Type": "application/json", "x-user-id": userId };
      const refundRes = await fetch("/api/refund-requests", { headers });
      if (refundRes.ok) {
        const refundData = await refundRes.json();
        const thisOrderRefund = (refundData.refundRequests || []).find(
          (r: RefundRequestInfo) => r.status !== "rejected"
        );
        if (thisOrderRefund) setExistingRefund(thisOrderRefund);
      }
    } catch {}
  }

  function openRefundModal(type: "cancel_refund" | "return_refund") {
    setRefundModal(type);
    setRefundReason("");
    setRefundError("");
    if (savedBank) {
      setUseSavedBank(true);
      setRefundBankDetails({
        accountHolderName: savedBank.accountHolderName,
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: savedBank.ifscCode,
        bankName: savedBank.bankName,
        upiId: savedBank.upiId || "",
      });
    } else {
      setUseSavedBank(false);
      setRefundBankDetails({
        accountHolderName: "",
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: "",
        bankName: "",
        upiId: "",
      });
    }
  }

  async function handleSubmitRefund() {
    if (!order || !refundModal) return;
    setRefundError("");

    if (refundReason.trim().length < 5) {
      setRefundError("Please provide a reason (at least 5 characters)");
      return;
    }

    if (!useSavedBank) {
      if (!refundBankDetails.accountHolderName.trim()) {
        setRefundError("Account holder name is required");
        return;
      }
      if (!refundBankDetails.accountNumber.trim()) {
        setRefundError("Account number is required");
        return;
      }
      if (refundBankDetails.accountNumber !== refundBankDetails.confirmAccountNumber) {
        setRefundError("Account numbers do not match");
        return;
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(refundBankDetails.ifscCode.trim().toUpperCase())) {
        setRefundError("Invalid IFSC code format (e.g., SBIN0001234)");
        return;
      }
      if (!refundBankDetails.bankName.trim()) {
        setRefundError("Bank name is required");
        return;
      }
    }

    setRefundLoading(true);
    try {
      const stored = localStorage.getItem("wox-user");
      const user = stored ? JSON.parse(stored) : null;
      const userId = user?.id || "";

      const bankPayload = useSavedBank && savedBank
        ? {
            accountHolderName: savedBank.accountHolderName,
            accountNumber: savedBank.accountNumber,
            ifscCode: savedBank.ifscCode,
            bankName: savedBank.bankName,
            upiId: savedBank.upiId || "",
          }
        : {
            accountHolderName: refundBankDetails.accountHolderName.trim(),
            accountNumber: refundBankDetails.accountNumber.trim(),
            ifscCode: refundBankDetails.ifscCode.trim().toUpperCase(),
            bankName: refundBankDetails.bankName.trim(),
            upiId: refundBankDetails.upiId.trim(),
          };

      const res = await fetch("/api/refund-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          orderId: order._id,
          type: refundModal,
          reason: refundReason.trim(),
          bankDetails: bankPayload,
          saveBankDetails,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRefundError(data.error || "Failed to submit refund request");
        return;
      }

      setRefundModal(null);
      fetchRefundStatus();
    } catch {
      setRefundError("Network error. Please try again.");
    } finally {
      setRefundLoading(false);
    }
  }

  async function handleSubmitReview() {
    if (!order || !reviewItem) return;
    const stored = localStorage.getItem("wox-user");
    const user = stored ? JSON.parse(stored) : null;
    if (!user?.id) {
      alert("Please log in to submit a review");
      return;
    }

    setReviewLoading(true);
    try {
      const productRes = await fetch(`/api/products/${reviewItem.slug}`);
      const productData = await productRes.json();
      const product = productData.product;
      if (!product?.id) {
        alert("Product not found");
        return;
      }

      const res = await fetch("/api/reviews/from-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          productId: product.id,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit review");
        return;
      }

      setReviewedSlugs((prev) => new Set([...prev, reviewItem.slug]));
      setReviewItem(null);
      setReviewRating(5);
      setReviewComment("");
    } catch {
      alert("Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  }

  function getTrackingIndex(status: string): number {
    const idx = trackingSteps.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  }

  const canRefund = true; // Both online payment and COD are eligible

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

      {/* Existing Refund Request Status */}
      {existingRefund && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Refund Request</h2>
            <Badge className={cn(refundStatusStyles[existingRefund.status])}>
              {refundStatusLabels[existingRefund.status]}
            </Badge>
          </div>
          <div className="text-sm text-zinc-600 space-y-1">
            <p>Type: {existingRefund.type === "cancel_refund" ? "Cancel & Refund" : "Return & Refund"}</p>
            <p>Amount: {formatPrice(existingRefund.amount)}</p>
            <p>Reason: {existingRefund.reason}</p>
            <p className="text-xs text-zinc-400">Submitted: {new Date(existingRefund.createdAt).toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}

      {/* Tracking */}
      {order.status !== "CANCELLED" && order.status !== "RETURNED" && order.status !== "REFUNDED" && (
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
          {order.status === "DELIVERED" && order.deliveredAt && (() => {
            const delivered = new Date(order.deliveredAt);
            const now = new Date();
            const daysSince = Math.floor((now.getTime() - delivered.getTime()) / (1000 * 60 * 60 * 24));
            const remaining = Math.max(0, 7 - daysSince);
            return (
              <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
                Delivered on {delivered.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {remaining > 0 ? (
                  <span className="ml-2 font-medium text-zinc-900">
                    · {remaining} day{remaining !== 1 ? "s" : ""} left for return/refund
                  </span>
                ) : (
                  <span className="ml-2 font-medium text-red-600">· Return/refund window expired</span>
                )}
              </div>
            );
          })()}
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
      {order.status === "REFUNDED" && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-5 text-center text-sm font-medium text-green-600">
          Refund has been processed for this order
        </div>
      )}

      {/* Items */}
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Items ({order.items.length})</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => {
            const canReview = order.status === "DELIVERED" && (order.paymentStatus === "PAID" || order.paymentStatus === "COMPLETED");
            const isReviewed = reviewedSlugs.has(item.slug);
            return (
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
                  {canReview && (
                    <button
                      onClick={() => { setReviewItem(item); setReviewRating(5); setReviewComment(""); }}
                      disabled={isReviewed}
                      className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${isReviewed ? "text-green-600" : "text-amber-600 hover:text-amber-700"}`}
                    >
                      <Star className={`h-3 w-3 ${isReviewed ? "fill-green-600" : "fill-amber-500"}`} />
                      {isReviewed ? "Reviewed" : "Write Review"}
                    </button>
                  )}
                </div>
                <span className="text-sm font-semibold text-zinc-900">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            );
          })}
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
          {order.taxDetails && order.taxDetails.totalTaxableAmount > 0 && (
            <div className="flex justify-between"><span className="text-zinc-500">Taxable Amount</span><span>{formatPrice(order.taxDetails.totalTaxableAmount)}</span></div>
          )}
          {order.taxDetails && order.taxDetails.totalGstAmount > 0 && (
            <>
              {order.taxDetails.isInterState ? (
                <div className="flex justify-between"><span className="text-zinc-500">IGST</span><span>{formatPrice(order.taxDetails.totalGstAmount)}</span></div>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-zinc-500">CGST</span><span>{formatPrice(order.taxDetails.totalCgst)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">SGST</span><span>{formatPrice(order.taxDetails.totalSgst)}</span></div>
                </>
              )}
            </>
          )}
          {!order.taxDetails && (
            <div className="flex justify-between"><span className="text-zinc-500">Tax (GST)</span><span>{formatPrice(order.tax)}</span></div>
          )}
          <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </div>

      {/* Actions */}
      {!existingRefund && order.status !== "CANCELLED" && order.status !== "RETURNED" && order.status !== "REFUNDED" && (
        <div className="mt-4 flex flex-wrap gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          {cancelableStatuses.includes(order.status) && (
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() => openRefundModal("cancel_refund")}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Cancel Order &amp; Refund
            </Button>
          )}
          {returnableStatuses.includes(order.status) && canRefund && (
            <Button
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
              disabled={actionLoading}
              onClick={() => openRefundModal("return_refund")}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Request Return &amp; Refund
            </Button>
          )}
          {returnableStatuses.includes(order.status) && canRefund && (
            <p className="text-xs text-zinc-400 w-full mt-1">
              Returns accepted within 7 days of delivery. Products must be above ₹199.
            </p>
          )}
        </div>
      )}

      {/* Refund Request Modal */}
      {refundModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setRefundModal(null); setRefundError(""); }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">
                {refundModal === "cancel_refund" ? "Cancel Order & Refund" : "Request Return & Refund"}
              </h3>
              <button
                onClick={() => { setRefundModal(null); setRefundError(""); }}
                className="text-zinc-400 hover:text-zinc-600 text-xl"
              >
                &times;
              </button>
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              Refund of {formatPrice(order.total)} will be credited to your bank account within 5-7 business days.
            </p>

            {/* Reason */}
            <div className="mt-4">
              <label className="text-sm font-medium text-zinc-700">
                {refundModal === "cancel_refund" ? "Reason for Cancellation" : "Reason for Return"}
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                placeholder="Please describe why you want to cancel/return this order..."
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            {/* Bank Details */}
            <div className="mt-4">
              <label className="text-sm font-medium text-zinc-700">Bank Details for Refund</label>

              {savedBank && (
                <div className="mt-2">
                  <label className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 cursor-pointer hover:bg-zinc-50">
                    <input
                      type="radio"
                      checked={useSavedBank}
                      onChange={() => setUseSavedBank(true)}
                      className="h-4 w-4 text-zinc-900"
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Use saved bank details</p>
                      <p className="text-xs text-zinc-500">{savedBank.bankName} •••• {savedBank.accountNumber.slice(-4)}</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 mt-2 cursor-pointer hover:bg-zinc-50">
                    <input
                      type="radio"
                      checked={!useSavedBank}
                      onChange={() => setUseSavedBank(false)}
                      className="h-4 w-4 text-zinc-900"
                    />
                    <p className="text-sm font-medium text-zinc-900">Enter different bank details</p>
                  </label>
                </div>
              )}

              {!useSavedBank && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Account Holder Name</label>
                    <Input
                      type="text"
                      value={refundBankDetails.accountHolderName}
                      onChange={(e) => setRefundBankDetails((p) => ({ ...p, accountHolderName: e.target.value }))}
                      placeholder="As per bank records"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Account Number</label>
                    <Input
                      type="password"
                      value={refundBankDetails.accountNumber}
                      onChange={(e) => setRefundBankDetails((p) => ({ ...p, accountNumber: e.target.value }))}
                      placeholder="Enter bank account number"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Confirm Account Number</label>
                    <Input
                      type="password"
                      value={refundBankDetails.confirmAccountNumber}
                      onChange={(e) => setRefundBankDetails((p) => ({ ...p, confirmAccountNumber: e.target.value }))}
                      placeholder="Re-enter account number"
                      className="text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">IFSC Code</label>
                      <Input
                        type="text"
                        value={refundBankDetails.ifscCode}
                        onChange={(e) => setRefundBankDetails((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                        placeholder="e.g. SBIN0001234"
                        className="text-sm uppercase"
                        maxLength={11}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Bank Name</label>
                      <Input
                        type="text"
                        value={refundBankDetails.bankName}
                        onChange={(e) => setRefundBankDetails((p) => ({ ...p, bankName: e.target.value }))}
                        placeholder="e.g. State Bank of India"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">UPI ID (optional)</label>
                    <Input
                      type="text"
                      value={refundBankDetails.upiId}
                      onChange={(e) => setRefundBankDetails((p) => ({ ...p, upiId: e.target.value }))}
                      placeholder="e.g. name@upi"
                      className="text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveBankDetails}
                      onChange={(e) => setSaveBankDetails(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    <span className="text-xs text-zinc-600">Save bank details for future refunds</span>
                  </label>
                </div>
              )}
            </div>

            {refundError && (
              <p className="mt-3 text-sm text-red-500">{refundError}</p>
            )}

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setRefundModal(null); setRefundError(""); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800"
                disabled={refundLoading}
                onClick={handleSubmitRefund}
              >
                {refundLoading ? "Submitting..." : "Submit Refund Request"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {reviewItem && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setReviewItem(null); setReviewRating(5); setReviewComment(""); }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Write a Review</h3>
              <button
                onClick={() => { setReviewItem(null); setReviewRating(5); setReviewComment(""); }}
                className="text-zinc-400 hover:text-zinc-600 text-xl"
              >
                &times;
              </button>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{reviewItem.name}</p>

            <div className="mt-4">
              <label className="text-sm font-medium text-zinc-700">Rating</label>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= reviewRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-zinc-700">Comment (optional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Share your experience with this product..."
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setReviewItem(null); setReviewRating(5); setReviewComment(""); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800"
                disabled={reviewLoading}
                onClick={handleSubmitReview}
              >
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
