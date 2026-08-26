"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  CreditCard,
  Check,
  ChevronRight,
  ChevronLeft,
  Shield,
  LogIn,
  ShoppingCart,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrderSuccess from "@/components/ui/order-success";
import useCartStore from "@/lib/stores/cart";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const steps = ["Address", "Delivery", "Payment", "Review", "Confirmation"];

type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
};

const emptyAddress: Address = {
  id: "",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
};

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("wox-user");
    if (!stored) {
      setAuthChecked(true);
      return;
    }
    const user = JSON.parse(stored);
    if (user?.email) {
      setCurrentUser(user);
    }
    setAuthChecked(true);
  }, []);

  const [currentStep, setCurrentStep] = useState(1);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">(
    "standard"
  );
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay"
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSaving, setOrderSaving] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    items: typeof items;
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
  } | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (document.getElementById("razorpay-script")) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  const shippingCost =
    paymentMethod === "cod"
      ? deliveryMethod === "express"
        ? 149
        : 49
      : deliveryMethod === "express"
        ? 149
        : 0;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shippingCost + tax;
  const hasValidItems =
    items.length > 0 && items.every((item) => item.price > 0 && item.quantity > 0);

  const selectedAddress =
    newAddress.name &&
    newAddress.phone &&
    newAddress.line1 &&
    newAddress.city &&
    newAddress.state &&
    newAddress.pincode
      ? { ...newAddress, id: "new" }
      : null;

  const canPlaceOrder = hasValidItems && total > 0 && selectedAddress && termsAccepted;

  function getEstimatedDelivery(): string {
    const days = deliveryMethod === "express" ? 2 : 6;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function generateOrderNumber(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `#WOX11${code}`;
  }

  async function saveOrderToDB(orderNum: string, paymentId?: string) {
    const stored = localStorage.getItem("wox-user");
    const user = stored ? JSON.parse(stored) : null;

    const res = await fetch("/api/mongo/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: orderNum,
        customerName: newAddress.name,
        customerPhone: newAddress.phone,
        customerEmail: user?.email || "",
        address: {
          name: newAddress.name,
          phone: newAddress.phone,
          line1: newAddress.line1,
          line2: newAddress.line2,
          city: newAddress.city,
          state: newAddress.state,
          pincode: newAddress.pincode,
          landmark: newAddress.landmark,
        },
        items: items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          image: item.image,
          slug: item.slug,
        })),
        subtotal,
        shippingCost,
        tax,
        total,
        paymentMethod,
        paymentId: paymentId || "",
        paymentStatus: paymentId ? "PAID" : "PENDING",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save order");
    }
  }

  function finalizeOrder(orderNum: string) {
    setOrderNumber(orderNum);
    setConfirmedOrder({
      items: [...items],
      subtotal,
      shippingCost,
      tax,
      total,
    });
    clearCart();
    setCurrentStep(5);
  }

  async function handlePlaceOrder() {
    const orderNum = generateOrderNumber();
    setOrderSaving(true);
    setOrderError(null);

    if (paymentMethod === "cod") {
      try {
        await saveOrderToDB(orderNum);
        finalizeOrder(orderNum);
      } catch (e) {
        console.error("Failed to save order:", e);
        setOrderError(
          e instanceof Error ? e.message : "Failed to save order. Please try again."
        );
      } finally {
        setOrderSaving(false);
      }
      return;
    }

    // Razorpay flow
    try {
      const payRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "INR" }),
      });

      if (!payRes.ok) {
        const payData = await payRes.json();
        throw new Error(payData.error || "Payment gateway unavailable");
      }

      const payData = await payRes.json();

      const stored = localStorage.getItem("wox-user");
      const user = stored ? JSON.parse(stored) : null;

      const razorpay = new window.Razorpay({
        key: payData.keyId,
        amount: payData.amount,
        currency: payData.currency,
        name: "WOX.11",
        description: `Order ${orderNum}`,
        order_id: payData.orderId,
        prefill: {
          name: newAddress.name,
          email: user?.email || "",
          contact: newAddress.phone,
        },
        theme: { color: "#18181b" },
        handler: async (response: RazorpayResponse) => {
          try {
            await saveOrderToDB(orderNum, response.razorpay_payment_id);
            finalizeOrder(orderNum);
          } catch (e) {
            console.error("Order save after payment failed:", e);
            setOrderError(
              "Payment successful but order save failed. Please contact support with payment ID: " +
                response.razorpay_payment_id
            );
          } finally {
            setOrderSaving(false);
          }
        },
        modal: {
          ondismiss: () => {
            setOrderSaving(false);
            setOrderError("Payment cancelled. Your order was not placed.");
          },
        },
      });

      razorpay.on("payment.failed", (response: { error: { description: string } }) => {
        setOrderSaving(false);
        setOrderError("Payment failed: " + response.error.description);
      });

      razorpay.open();
    } catch (e) {
      console.error("Payment error:", e);
      setOrderError(
        e instanceof Error ? e.message : "Payment service unavailable. Please try again."
      );
      setOrderSaving(false);
    }
  }

  function handleNextStep() {
    if (currentStep === 4) {
      handlePlaceOrder();
    } else {
      setCurrentStep((s) => Math.min(s + 1, 5));
    }
  }

  function handlePrevStep() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  async function handlePincodeLookup(pincode: string) {
    setNewAddress((prev) => ({ ...prev, pincode, city: "", state: "" }));
    setPincodeError("");

    if (pincode.length !== 6) return;

    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();

      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        const district = postOffice.District || "";
        const state = postOffice.State || "";
        const city = postOffice.Division || district;

        setNewAddress((prev) => ({ ...prev, city, state }));
        setPincodeError("");
      } else {
        setPincodeError("Invalid pincode");
      }
    } catch {
      setPincodeError("Could not fetch pincode details");
    } finally {
      setPincodeLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
            <LogIn className="h-10 w-10 text-zinc-400" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
            Login Required
          </h2>
          <p className="mt-3 text-sm text-zinc-500">
            Please sign in to your account to continue with checkout and place your order.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              variant="outline"
              className="border-zinc-300"
            >
              <Link href="/cart">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Back to Cart
              </Link>
            </Button>
            <Button
              asChild
              className="bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-zinc-900 underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Checkout
        </h1>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            {steps.map((step, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all",
                        isCompleted
                          ? "bg-zinc-900 text-white"
                          : isCurrent
                            ? "bg-zinc-900 text-white ring-4 ring-zinc-100"
                            : "bg-zinc-200 text-zinc-500"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        stepNum
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-xs font-medium",
                        isCurrent ? "text-zinc-900" : "text-zinc-400"
                      )}
                    >
                      {step}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 h-0.5 flex-1",
                        stepNum < currentStep ? "bg-zinc-900" : "bg-zinc-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile progress */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-900">
                Step {currentStep} of {steps.length}
              </span>
              <span className="text-zinc-500">{steps[currentStep - 1]}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full bg-zinc-900 transition-all"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left: Step Content */}
          <div>
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Delivery Address
                </h2>

                <div className="rounded-lg border border-zinc-200 p-5">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Enter your delivery address
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        Pincode *
                      </label>
                      <div className="relative mt-1">
                        <Input
                          value={newAddress.pincode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            handlePincodeLookup(val);
                          }}
                          placeholder="6-digit pincode"
                          maxLength={6}
                        />
                        {pincodeLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                          </div>
                        )}
                      </div>
                      {pincodeError && (
                        <p className="mt-1 text-xs text-red-500">{pincodeError}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        Phone *
                      </label>
                      <Input
                        value={newAddress.phone}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                        }
                        placeholder="10-digit mobile number"
                        className="mt-1"
                        maxLength={10}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-600">
                        Full Name *
                      </label>
                      <Input
                        value={newAddress.name}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, name: e.target.value })
                        }
                        placeholder="Full name"
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-600">
                        House / Flat / Building *
                      </label>
                      <Input
                        value={newAddress.line1}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, line1: e.target.value })
                        }
                        placeholder="House no., Flat no., Building name"
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-600">
                        Street / Area / Landmark
                      </label>
                      <Input
                        value={newAddress.line2}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, line2: e.target.value })
                        }
                        placeholder="Street, Area, Sector, Landmark (optional)"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        City *
                      </label>
                      <Input
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                        placeholder={pincodeLoading ? "Fetching..." : "City"}
                        className="mt-1"
                        readOnly={pincodeLoading}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        State *
                      </label>
                      <Input
                        value={newAddress.state}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, state: e.target.value })
                        }
                        placeholder={pincodeLoading ? "Fetching..." : "State"}
                        className="mt-1"
                        readOnly={pincodeLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleNextStep}
                    disabled={!selectedAddress}
                    className="bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    Continue to Delivery
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Delivery */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Delivery Method
                </h2>

                <div className="space-y-3">
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-4 rounded-lg border p-5 transition-all",
                      deliveryMethod === "standard"
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value="standard"
                      checked={deliveryMethod === "standard"}
                      onChange={() => setDeliveryMethod("standard")}
                      className="h-4 w-4 accent-zinc-900"
                    />
                    <Truck className="h-5 w-5 text-zinc-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-900">
                          Standard Delivery
                        </span>
                        <span className="text-sm font-semibold text-zinc-900">
                          Free
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        5-7 business days
                      </p>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-4 rounded-lg border p-5 transition-all",
                      deliveryMethod === "express"
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value="express"
                      checked={deliveryMethod === "express"}
                      onChange={() => setDeliveryMethod("express")}
                      className="h-4 w-4 accent-zinc-900"
                    />
                    <Truck className="h-5 w-5 text-zinc-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-900">
                          Express Delivery
                        </span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {formatPrice(149)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        2-3 business days
                      </p>
                    </div>
                  </label>
                </div>

                <div className="rounded-lg bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-600">
                    Estimated delivery by{" "}
                    <span className="font-semibold text-zinc-900">
                      {getEstimatedDelivery()}
                    </span>
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-zinc-300"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    Continue to Payment
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Payment Method
                </h2>

                <div className="space-y-3">
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-4 rounded-lg border p-5 transition-all",
                      paymentMethod === "razorpay"
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      className="h-4 w-4 accent-zinc-900"
                    />
                    <CreditCard className="h-5 w-5 text-zinc-600" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-zinc-900">
                        Pay Online
                      </span>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Cards, UPI, Net Banking, Wallets
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <Shield className="h-3.5 w-3.5" />
                      Secure
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-4 rounded-lg border p-5 transition-all",
                      paymentMethod === "cod"
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="h-4 w-4 accent-zinc-900"
                    />
                    <div className="h-5 w-5 text-center text-xs font-bold text-zinc-600">
                      ₹
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-zinc-900">
                        Cash on Delivery
                      </span>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Pay when you receive your order
                      </p>
                    </div>
                  </label>
                </div>

                {paymentMethod === "cod" && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-800">
                      A handling fee of {formatPrice(49)} applies for Cash on
                      Delivery orders. Please keep exact change ready at the time
                      of delivery.
                    </p>
                  </div>
                )}

                {paymentMethod === "razorpay" && (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
                    <div className="flex flex-col items-center justify-center text-center">
                      <CreditCard className="h-10 w-10 text-zinc-300" />
                      <p className="mt-3 text-sm font-medium text-zinc-900">
                        Secure Online Payment
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        You will be redirected to Razorpay to complete the
                        payment securely. Order is placed only after payment.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-zinc-300"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    Continue to Review
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Review Order
                </h2>

                {/* Items */}
                <div className="rounded-lg border border-zinc-200 p-5">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Items ({items.length})
                  </h3>
                  <div className="mt-4 space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4"
                      >
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden bg-zinc-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Size: {item.size} | Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-zinc-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address */}
                {selectedAddress && (
                  <div className="rounded-lg border border-zinc-200 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-900">
                        Delivery Address
                      </h3>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-zinc-500 underline-offset-4 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-zinc-700">
                        {selectedAddress.name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {selectedAddress.line1}
                        {selectedAddress.line2
                          ? `, ${selectedAddress.line2}`
                          : ""}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {selectedAddress.city}, {selectedAddress.state} -{" "}
                        {selectedAddress.pincode}
                      </p>
                      <p className="text-sm text-zinc-500">
                        Phone: {selectedAddress.phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Delivery */}
                <div className="rounded-lg border border-zinc-200 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Delivery Method
                    </h3>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-xs text-zinc-500 underline-offset-4 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-zinc-700">
                      {deliveryMethod === "express"
                        ? "Express Delivery (2-3 days)"
                        : "Standard Delivery (5-7 days)"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Estimated by {getEstimatedDelivery()}
                    </p>
                  </div>
                </div>

                {/* Payment */}
                <div className="rounded-lg border border-zinc-200 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Payment Method
                    </h3>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="text-xs text-zinc-500 underline-offset-4 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-zinc-700">
                      {paymentMethod === "razorpay"
                        ? "Pay Online (Razorpay)"
                        : "Cash on Delivery"}
                    </p>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-zinc-900"
                  />
                  <span className="text-sm text-zinc-500">
                    I agree to the{" "}
                    <Link
                      href="#"
                      className="text-zinc-900 underline-offset-4 hover:underline"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="#"
                      className="text-zinc-900 underline-offset-4 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    . I understand that my order is subject to availability and
                    dispatch timelines.
                  </span>
                </label>

                {/* Error */}
                {orderError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {orderError}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-zinc-300"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!canPlaceOrder || orderSaving}
                    className="bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    {orderSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {paymentMethod === "razorpay"
                          ? "Processing Payment..."
                          : "Placing Order..."}
                      </span>
                    ) : (
                      <>
                        {paymentMethod === "razorpay" ? (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay {formatPrice(total)}
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Place Order
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && confirmedOrder && (
              <div className="py-4">
                <OrderSuccess orderNumber={orderNumber || ""} />

                <div className="mx-auto mt-6 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Order Summary
                  </h3>
                  <div className="mt-4 max-h-56 space-y-3 overflow-y-auto">
                    {confirmedOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {item.size} &middot; Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-zinc-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 space-y-2.5 border-t border-zinc-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">
                        Items ({confirmedOrder.items.length})
                      </span>
                      <span className="text-zinc-900">
                        {formatPrice(confirmedOrder.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Shipping</span>
                      <span className="text-zinc-900">
                        {confirmedOrder.shippingCost === 0
                          ? "Free"
                          : formatPrice(confirmedOrder.shippingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Tax (GST 18%)</span>
                      <span className="text-zinc-900">
                        {formatPrice(confirmedOrder.tax)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-100 pt-2.5 text-sm">
                      <span className="font-bold text-zinc-900">
                        Total Paid
                      </span>
                      <span className="font-bold text-zinc-900">
                        {formatPrice(confirmedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 border-zinc-300"
                  >
                    <Link href="/">Continue Shopping</Link>
                  </Button>
                  <Button
                    asChild
                    className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    <Link href="/account/orders">View Orders</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Price Summary Sidebar */}
          {currentStep < 5 && (
            <div className="hidden lg:block">
              <div className="sticky top-24 rounded-lg border border-zinc-200 p-5">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Order Summary
                </h3>

                <div className="mt-4 max-h-64 space-y-4 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden bg-zinc-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-900 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {item.size} | Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-zinc-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2 border-t border-zinc-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-zinc-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Shipping</span>
                    <span className="text-zinc-900">
                      {shippingCost === 0
                        ? "Free"
                        : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Tax (GST 18%)</span>
                    <span className="text-zinc-900">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-100 pt-2 text-sm">
                    <span className="font-semibold text-zinc-900">Total</span>
                    <span className="font-semibold text-zinc-900">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Price Summary */}
          {currentStep < 5 && (
            <div className="lg:hidden">
              <div className="rounded-lg border border-zinc-200 p-5">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Order Summary
                </h3>

                <div className="mt-4 max-h-48 space-y-3 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden bg-zinc-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-900 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {item.size} | Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-zinc-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-zinc-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Shipping</span>
                    <span className="text-zinc-900">
                      {shippingCost === 0
                        ? "Free"
                        : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Tax (GST 18%)</span>
                    <span className="text-zinc-900">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-100 pt-2 text-sm">
                    <span className="font-semibold text-zinc-900">Total</span>
                    <span className="font-semibold text-zinc-900">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
