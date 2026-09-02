"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, XCircle, RotateCcw, RefreshCw, Banknote, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface SavedBankInfo {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId: string;
}

const VALID_ACTIONS = ["cancel", "return", "replace"] as const;
type ActionType = (typeof VALID_ACTIONS)[number];

const actionConfig: Record<ActionType, {
  title: string;
  subtitle: string;
  icon: typeof XCircle;
  color: string;
  btnColor: string;
}> = {
  cancel: {
    title: "Cancel Order & Refund",
    subtitle: "Your refund will be credited to your bank account within 5-7 business days.",
    icon: XCircle,
    color: "text-red-600",
    btnColor: "bg-red-600 hover:bg-red-700",
  },
  return: {
    title: "Request Return & Refund",
    subtitle: "Return the product and get a refund to your bank account within 5-7 business days.",
    icon: RotateCcw,
    color: "text-orange-600",
    btnColor: "bg-orange-600 hover:bg-orange-700",
  },
  replace: {
    title: "Request Replacement",
    subtitle: "Get a replacement for this product. Our team will contact you with details.",
    icon: RefreshCw,
    color: "text-blue-600",
    btnColor: "bg-blue-600 hover:bg-blue-700",
  },
};

const cancelableStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"];
const shippedStatuses = ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"];
const returnableStatuses = ["DELIVERED"];
const replaceableStatuses = ["DELIVERED"];

export default function OrderActionPage({
  params,
}: {
  params: Promise<{ id: string; action: string }>;
}) {
  const { id, action } = use(params);
  const router = useRouter();
  const validAction = VALID_ACTIONS.includes(action as ActionType) ? (action as ActionType) : null;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [reason, setReason] = useState("");
  const [replacementReason, setReplacementReason] = useState("");
  const [preferredSize, setPreferredSize] = useState("");
  const [preferredColor, setPreferredColor] = useState("");

  const [savedBank, setSavedBank] = useState<SavedBankInfo | null>(null);
  const [useSavedBank, setUseSavedBank] = useState(false);
  const [saveBankDetails, setSaveBankDetails] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  });
  const [ifscVerifying, setIfscVerifying] = useState(false);
  const [ifscVerified, setIfscVerified] = useState(false);
  const [ifscError, setIfscError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const stored = localStorage.getItem("wox-user");
        const user = stored ? JSON.parse(stored) : null;
        const userId = user?.id || localStorage.getItem("wox-user-id") || "";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (userId) headers["x-user-id"] = userId;

        const res = await fetch(`/api/mongo/orders/${id}`, { headers });
        if (!res.ok) { setOrder(null); return; }
        const data = await res.json();
        setOrder(data.order || null);

        const bankRes = await fetch("/api/saved-bank-details", { headers });
        if (bankRes.ok) {
          const bankData = await bankRes.json();
          if (bankData.bankDetails) setSavedBank(bankData.bankDetails);
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  function openSavedBank() {
    if (savedBank) {
      setUseSavedBank(true);
      setBankDetails({
        accountHolderName: savedBank.accountHolderName,
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: savedBank.ifscCode,
        bankName: savedBank.bankName,
        upiId: savedBank.upiId || "",
      });
    }
  }

  function openNewBank() {
    setUseSavedBank(false);
    setIfscVerified(false);
    setIfscError("");
    setBankDetails({
      accountHolderName: "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      bankName: "",
      upiId: "",
    });
  }

  async function verifyIfsc() {
    const code = bankDetails.ifscCode.trim().toUpperCase();
    if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(code)) {
      setIfscError("Invalid IFSC format");
      setIfscVerified(false);
      return;
    }
    setIfscVerifying(true);
    setIfscError("");
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${code}`);
      if (!res.ok) throw new Error("Invalid IFSC code");
      const data = await res.json();
      if (data.BANK) {
        setBankDetails((p) => ({ ...p, bankName: data.BANK, ifscCode: code }));
        setIfscVerified(true);
        setIfscError("");
      } else {
        setIfscError("IFSC code not found");
        setIfscVerified(false);
      }
    } catch {
      setIfscError("Could not verify IFSC code");
      setIfscVerified(false);
    } finally {
      setIfscVerifying(false);
    }
  }

  function validateAccountNumber(): string | null {
    const num = bankDetails.accountNumber.trim();
    if (!num) return "Account number is required";
    if (!/^\d{9,18}$/.test(num)) return "Account number must be 9-18 digits";
    return null;
  }

  async function handleSubmit() {
    if (!order) return;
    setError("");

    if (reason.trim().length < 5) {
      setError("Please provide a reason (at least 5 characters)");
      return;
    }

    const isCODOrder = order.paymentMethod === "cod";
    const needsBankDetails = validAction !== "replace" && !(validAction === "cancel" && isCODOrder);

    if (validAction === "replace") {
      setSubmitting(true);
      try {
        const stored = localStorage.getItem("wox-user");
        const user = stored ? JSON.parse(stored) : null;
        const userId = user?.id || "";

        const res = await fetch("/api/refund-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-id": userId },
          body: JSON.stringify({
            orderId: order._id,
            type: "return_refund",
            reason: `[REPLACEMENT REQUEST] ${reason.trim()}${preferredSize ? ` | Preferred size: ${preferredSize}` : ""}${preferredColor ? ` | Preferred color: ${preferredColor}` : ""}`,
            bankDetails: null,
            useSavedBank: false,
            saveBankDetails: false,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to submit replacement request");
          return;
        }
        setSuccess(true);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (needsBankDetails && !useSavedBank) {
      if (!bankDetails.accountHolderName.trim()) {
        setError("Account holder name is required"); return;
      }
      const accError = validateAccountNumber();
      if (accError) { setError(accError); return; }
      if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
        setError("Account numbers do not match"); return;
      }
      if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(bankDetails.ifscCode.trim())) {
        setError("Invalid IFSC code format (e.g., SBIN0001234)"); return;
      }
      if (!ifscVerified && !bankDetails.bankName.trim()) {
        setError("Please verify IFSC code or enter bank name"); return;
      }
      if (!bankDetails.bankName.trim()) {
        setError("Bank name is required"); return;
      }
    }

    setSubmitting(true);
    try {
      const stored = localStorage.getItem("wox-user");
      const user = stored ? JSON.parse(stored) : null;
      const userId = user?.id || "";

      const refundType = validAction === "cancel" ? "cancel_refund" : "return_refund";

      const res = await fetch("/api/refund-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          orderId: order._id,
          type: refundType,
          reason: reason.trim(),
          bankDetails: useSavedBank ? null : {
            accountHolderName: bankDetails.accountHolderName.trim(),
            accountNumber: bankDetails.accountNumber.trim(),
            ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
            bankName: bankDetails.bankName.trim(),
            upiId: bankDetails.upiId.trim(),
          },
          useSavedBank: useSavedBank && !!savedBank,
          saveBankDetails,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit request");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <WoxLoader />
      </div>
    );
  }

  if (!validAction) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-zinc-500">Invalid action.</p>
          <Link href={`/account/orders/${id}`} className="mt-4 inline-block">
            <Button variant="outline">Back to Order</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-zinc-500">Order not found.</p>
          <Link href="/account/orders" className="mt-4 inline-block">
            <Button variant="outline">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isDelivered = order.status === "DELIVERED";
  const isOnlinePaid = order.paymentMethod === "razorpay";
  const isCOD = order.paymentMethod === "cod";
  const isPreDelivery = !isDelivered && !["CANCELLED", "RETURNED", "REFUNDED"].includes(order.status);

  let canDoAction = false;
  let blockReason = "";

  if (validAction === "cancel") {
    if (isPreDelivery && cancelableStatuses.includes(order.status)) {
      canDoAction = true;
    } else if (shippedStatuses.includes(order.status)) {
      blockReason = "This order has already been shipped and cannot be cancelled. Please wait for delivery and request a return instead.";
    } else if (isDelivered) {
      blockReason = "This order has already been delivered. You can request a return instead.";
    } else {
      blockReason = `This action is not available for an order with status "${order.status}".`;
    }
  } else if (validAction === "return") {
    if (isDelivered) {
      canDoAction = true;
    } else if (isCOD) {
      blockReason = "Return & Refund is not available for COD orders before delivery. Please wait until the order is delivered and payment is confirmed.";
    } else if (isPreDelivery) {
      blockReason = "Return & Refund is only available after the order has been delivered.";
    } else {
      blockReason = `This action is not available for an order with status "${order.status}".`;
    }
  } else if (validAction === "replace") {
    if (isDelivered) {
      canDoAction = true;
    } else {
      blockReason = "Replacement is only available after the order has been delivered.";
    }
  }

  if (!canDoAction) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href={`/account/orders/${id}`} className="text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{actionConfig[validAction].title}</h1>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-zinc-500">
            {blockReason || `This action is not available for an order with status "${order.status}".`}
          </p>
          <Link href={`/account/orders/${id}`} className="mt-4 inline-block">
            <Button variant="outline">Back to Order</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    const Icon = actionConfig[validAction].icon;
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Icon className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-zinc-900">Request Submitted</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {validAction === "replace"
              ? "Your replacement request has been submitted. Our team will contact you shortly."
              : validAction === "cancel" && isCOD
              ? "Your order has been cancelled successfully."
              : `Your ${validAction === "cancel" ? "cancellation" : "return"} request has been submitted. We will review it shortly.`}
          </p>
          <Link href={`/account/orders/${id}`} className="mt-6 inline-block">
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800">Back to Order</Button>
          </Link>
        </div>
      </div>
    );
  }

  const config = actionConfig[validAction];
  const ConfigIcon = config.icon;
  const showBankDetails = validAction !== "replace" && !(validAction === "cancel" && isCOD);
  const displayTitle = validAction === "cancel" && isCOD ? "Cancel Order" : config.title;
  const displaySubtitle = validAction === "cancel" && isCOD
    ? "Your order will be cancelled. No payment has been collected yet."
    : config.subtitle;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/account/orders/${id}`} className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className={cn("text-2xl font-bold tracking-tight", config.color)}>
            {displayTitle}
          </h1>
          <p className="text-xs text-zinc-500">Order {order.orderNumber}</p>
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
            {order.items[0]?.image ? (
              <Image src={order.items[0].image} alt={order.items[0].name} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">No Image</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 line-clamp-1">{order.items[0]?.name}</p>
            <p className="text-xs text-zinc-500">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} · {order.paymentMethod.toUpperCase()}
            </p>
          </div>
          <span className="text-sm font-bold text-zinc-900">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Refund Info */}
      {showBankDetails && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-zinc-500" />
            <p className="text-sm font-medium text-zinc-900">
              {validAction === "cancel" && isCOD
                ? "Your order will be cancelled. No payment has been collected."
                : `Refund of ${formatPrice(order.total)} will be credited within 5-7 business days.`}
            </p>
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-zinc-700">
          {validAction === "cancel" ? "Reason for Cancellation" : validAction === "return" ? "Reason for Return" : "Describe the Issue"}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={
            validAction === "cancel"
              ? "Why do you want to cancel this order?"
              : validAction === "return"
              ? "Why do you want to return this product?"
              : "What issue are you facing with this product?"
          }
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      {/* Replacement-specific fields */}
      {validAction === "replace" && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium text-zinc-700">Preferred Size (optional)</label>
            <Input
              type="text"
              value={preferredSize}
              onChange={(e) => setPreferredSize(e.target.value)}
              placeholder="e.g., M, L, XL"
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Preferred Color/Variant (optional)</label>
            <Input
              type="text"
              value={preferredColor}
              onChange={(e) => setPreferredColor(e.target.value)}
              placeholder="e.g., Black, Blue"
              className="mt-1 text-sm"
            />
          </div>
        </div>
      )}

      {/* Bank Details */}
      {showBankDetails && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-zinc-700">Bank Details for Refund</label>

          {savedBank && (
            <div className="mt-2 space-y-2">
              <label className={cn(
                "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors",
                useSavedBank ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:bg-zinc-50"
              )}>
                <input type="radio" checked={useSavedBank} onChange={openSavedBank} className="h-4 w-4 text-zinc-900" />
                <div>
                  <p className="text-sm font-medium text-zinc-900">Use saved bank details</p>
                  <p className="text-xs text-zinc-500">{savedBank.bankName} •••• {savedBank.accountNumber.slice(-4)}</p>
                </div>
              </label>
              <label className={cn(
                "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors",
                !useSavedBank ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:bg-zinc-50"
              )}>
                <input type="radio" checked={!useSavedBank} onChange={openNewBank} className="h-4 w-4 text-zinc-900" />
                <p className="text-sm font-medium text-zinc-900">Enter different bank details</p>
              </label>
            </div>
          )}

          {!useSavedBank && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Account Holder Name</label>
                <Input type="text" value={bankDetails.accountHolderName} onChange={(e) => setBankDetails((p) => ({ ...p, accountHolderName: e.target.value }))} placeholder="As per bank records" className="text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Account Number</label>
                <Input type="password" value={bankDetails.accountNumber} onChange={(e) => setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))} placeholder="Enter bank account number" className="text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Confirm Account Number</label>
                <Input type="password" value={bankDetails.confirmAccountNumber} onChange={(e) => setBankDetails((p) => ({ ...p, confirmAccountNumber: e.target.value }))} placeholder="Re-enter account number" className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">IFSC Code</label>
                  <div className="flex gap-1.5">
                    <Input type="text" value={bankDetails.ifscCode} onChange={(e) => { setBankDetails((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() })); setIfscVerified(false); setIfscError(""); }} placeholder="e.g. SBIN0001234" className="text-sm uppercase flex-1" maxLength={11} />
                    <button
                      type="button"
                      onClick={verifyIfsc}
                      disabled={ifscVerifying || bankDetails.ifscCode.length < 11}
                      className={cn(
                        "flex-shrink-0 rounded-lg px-3 text-xs font-medium transition-colors",
                        ifscVerified
                          ? "bg-green-50 text-green-700"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
                      )}
                    >
                      {ifscVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : ifscVerified ? <CheckCircle className="h-3.5 w-3.5" /> : "Verify"}
                    </button>
                  </div>
                  {ifscError && <p className="mt-1 text-[11px] text-red-500">{ifscError}</p>}
                  {ifscVerified && <p className="mt-1 text-[11px] text-green-600">IFSC verified</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Bank Name</label>
                  <Input type="text" value={bankDetails.bankName} onChange={(e) => setBankDetails((p) => ({ ...p, bankName: e.target.value }))} placeholder={ifscVerified ? "Auto-filled" : "e.g. State Bank of India"} className="text-sm" disabled={ifscVerified} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">UPI ID (optional)</label>
                <Input type="text" value={bankDetails.upiId} onChange={(e) => setBankDetails((p) => ({ ...p, upiId: e.target.value }))} placeholder="e.g. name@upi" className="text-sm" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={saveBankDetails} onChange={(e) => setSaveBankDetails(e.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
                <span className="text-xs text-zinc-600">Save bank details for future refunds</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Submit */}
      <div className="mt-6 flex gap-3">
        <Link href={`/account/orders/${id}`} className="flex-1">
          <Button variant="outline" className="w-full">Cancel</Button>
        </Link>
        <Button
          className={cn("flex-1 text-white", config.btnColor)}
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </div>
  );
}
