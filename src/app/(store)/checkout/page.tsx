"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Truck,
  CreditCard,
  Check,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import useCartStore from "@/lib/stores/cart";

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
  const hasValidItems = items.length > 0 && items.every((item) => item.price > 0 && item.quantity > 0);

  const selectedAddress =
    newAddress.name && newAddress.phone && newAddress.line1 && newAddress.city && newAddress.state && newAddress.pincode
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

  async function handlePlaceOrder() {
    const orderNum = generateOrderNumber();
    setOrderNumber(orderNum);

    try {
      await fetch("/api/mongo/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNum,
          customerName: newAddress.name,
          customerPhone: newAddress.phone,
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
        }),
      });
    } catch (e) {
      console.error("Failed to save order:", e);
    }

    clearCart();
    setCurrentStep(5);
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
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        Phone *
                      </label>
                      <Input
                        value={newAddress.phone}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, phone: e.target.value })
                        }
                        placeholder="10-digit mobile number"
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-600">
                        Address Line 1 *
                      </label>
                      <Input
                        value={newAddress.line1}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, line1: e.target.value })
                        }
                        placeholder="House/Flat no., Building name, Street"
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-600">
                        Address Line 2
                      </label>
                      <Input
                        value={newAddress.line2}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, line2: e.target.value })
                        }
                        placeholder="Area, Colony, Sector (optional)"
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
                        placeholder="City"
                        className="mt-1"
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
                        placeholder="State"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        Pincode *
                      </label>
                      <Input
                        value={newAddress.pincode}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, pincode: e.target.value })
                        }
                        placeholder="6-digit pincode"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        Landmark
                      </label>
                      <Input
                        value={newAddress.landmark}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            landmark: e.target.value,
                          })
                        }
                        placeholder="Near (optional)"
                        className="mt-1"
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
                        Razorpay
                      </span>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Cards, UPI, Net Banking, Wallets
                      </p>
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
                        Razorpay Payment Gateway
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        You will be redirected to Razorpay after reviewing your
                        order to complete the payment securely.
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
                        ? "Razorpay - Online Payment"
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
                    disabled={!canPlaceOrder}
                    className="bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Place Order
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="h-20 w-20 text-green-500" />
                <h2 className="mt-6 text-2xl font-semibold text-zinc-900">
                  Thank you for your order!
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Your order has been placed successfully.
                </p>
                {orderNumber && (
                  <Badge
                    variant="secondary"
                    className="mt-4 px-4 py-1.5 text-sm"
                  >
                    Order #{orderNumber}
                  </Badge>
                )}

                <div className="mt-8 w-full max-w-md rounded-lg border border-zinc-200 p-5 text-left">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Order Details
                  </h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Items</span>
                      <span className="text-zinc-900">{items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Subtotal</span>
                      <span className="text-zinc-900">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Shipping</span>
                      <span className="text-zinc-900">
                        {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tax (GST 18%)</span>
                      <span className="text-zinc-900">{formatPrice(tax)}</span>
                    </div>
                    <div className="border-t border-zinc-100 pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-zinc-900">Total</span>
                        <span className="font-semibold text-zinc-900">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="outline" className="border-zinc-300">
                    <Link href="/">Continue Shopping</Link>
                  </Button>
                  <Button asChild className="bg-zinc-900 text-white hover:bg-zinc-800">
                    <Link href="/orders">View Orders</Link>
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
                    <span className="text-zinc-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Shipping</span>
                    <span className="text-zinc-900">
                      {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
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
                    <span className="text-zinc-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Shipping</span>
                    <span className="text-zinc-900">
                      {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
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
