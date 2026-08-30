"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  MapPin,
  Plus,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrderSuccess from "@/components/ui/order-success";
import useCartStore from "@/lib/stores/cart";
import {
  getSavedAddresses,
  saveSavedAddresses,
  addressToOrderAddress,
  formatAddressShort,
  type SavedAddress,
} from "@/app/(store)/account/addresses/page";

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
  taluk: string;
  district: string;
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
  taluk: "",
  district: "",
  state: "",
  pincode: "",
  landmark: "",
};

export default function CheckoutPage() {
  const { items: cartItems, subtotal: cartSubtotal, clearCart } = useCartStore();
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const isBuyNow = searchParams.get("buyNow") === "true";

  const [buyNowItem, setBuyNowItem] = useState<{
    productId: string; name: string; slug: string; image: string; price: number;
    size: string; sizeId: string; quantity: number; category: string; gender: string;
  } | null>(null);

  const items = isBuyNow && buyNowItem
    ? [{ id: "buy-now", productId: buyNowItem.productId, name: buyNowItem.name, slug: buyNowItem.slug, image: buyNowItem.image, price: buyNowItem.price, size: buyNowItem.size, sizeId: buyNowItem.sizeId, quantity: buyNowItem.quantity, maxQuantity: 10, category: buyNowItem.category, gender: buyNowItem.gender }]
    : cartItems;

  const subtotal = isBuyNow && buyNowItem
    ? buyNowItem.price * buyNowItem.quantity
    : cartSubtotal;

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (isBuyNow) {
      const stored = sessionStorage.getItem("wox-buy-now");
      if (stored) {
        setBuyNowItem(JSON.parse(stored));
      }
    }
  }, [isBuyNow]);

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
    setSavedAddresses(getSavedAddresses());
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
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [shakingFields, setShakingFields] = useState<Record<string, boolean>>({});
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    checkoutRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [currentStep]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const shippingCost = (() => {
    const state = newAddress.state?.trim().toLowerCase() || "";
    if (state === "kerala") return 0;
    if (state && ["andhra pradesh","arunachal pradesh","assam","bihar","chhattisgarh","goa","gujarat","haryana","himachal pradesh","jharkhand","karnataka","madhya pradesh","maharashtra","manipur","meghalaya","mizoram","nagaland","odisha","punjab","rajasthan","sikkim","tamil nadu","telangana","tripura","uttar pradesh","uttarakhand","west bengal","andaman and nicobar islands","chandigarh","dadra and nagar haveli and daman and diu","delhi","jammu and kashmir","ladakh","lakshadweep","puducherry"].includes(state)) return 50;
    return 0;
  })();

  const isIndianState = (() => {
    const state = newAddress.state?.trim().toLowerCase() || "";
    return state === "kerala" || ["andhra pradesh","arunachal pradesh","assam","bihar","chhattisgarh","goa","gujarat","haryana","himachal pradesh","jharkhand","karnataka","madhya pradesh","maharashtra","manipur","meghalaya","mizoram","nagaland","odisha","punjab","rajasthan","sikkim","tamil nadu","telangana","tripura","uttar pradesh","uttarakhand","west bengal","andaman and nicobar islands","chandigarh","dadra and nagar haveli and daman and diu","delhi","jammu and kashmir","ladakh","lakshadweep","puducherry"].includes(state);
  })();

  const couponDiscount = appliedCoupon?.discount ?? 0;

  const hasValidAddress = !!(newAddress.name && newAddress.phone && newAddress.line1 && newAddress.city && newAddress.state && newAddress.pincode);
  const isOutsideIndia = hasValidAddress && !isIndianState;
  const tax = Math.round(Math.max(subtotal - couponDiscount, 0) * 0.18);
  const total = Math.max(subtotal - couponDiscount, 0) + shippingCost + tax;
  const hasValidItems =
    items.length > 0 && items.every((item) => item.price > 0 && item.quantity > 0);

  const selectedAddress =
    newAddress.name &&
    newAddress.phone &&
    newAddress.line1 &&
    newAddress.city &&
    newAddress.taluk &&
    newAddress.district &&
    newAddress.state &&
    newAddress.pincode
      ? { ...newAddress, id: "new" }
      : null;

  const canPlaceOrder = hasValidItems && total > 0 && selectedAddress && termsAccepted && !isOutsideIndia;

  function triggerFieldError(fieldName: string) {
    setFieldErrors((prev) => ({ ...prev, [fieldName]: true }));
    setShakingFields((prev) => ({ ...prev, [fieldName]: true }));
    setTimeout(() => {
      setShakingFields((prev) => ({ ...prev, [fieldName]: false }));
    }, 400);
  }

  function clearFieldError(fieldName: string) {
    setFieldErrors((prev) => ({ ...prev, [fieldName]: false }));
  }

  function validateAddressFields(): boolean {
    const fields: { name: string; value: string }[] = [
      { name: "pincode", value: newAddress.pincode },
      { name: "phone", value: newAddress.phone },
      { name: "name", value: newAddress.name },
      { name: "line1", value: newAddress.line1 },
      { name: "line2", value: newAddress.line2 },
      { name: "city", value: newAddress.city },
      { name: "taluk", value: newAddress.taluk },
      { name: "district", value: newAddress.district },
      { name: "state", value: newAddress.state },
    ];
    let valid = true;
    const errors: Record<string, boolean> = {};
    const shakes: Record<string, boolean> = {};
    for (const f of fields) {
      if (!f.value.trim()) {
        errors[f.name] = true;
        shakes[f.name] = true;
        valid = false;
      }
    }
    setFieldErrors(errors);
    setShakingFields(shakes);
    if (!valid) {
      setTimeout(() => setShakingFields({}), 400);
    }
    return valid;
  }

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
    const visitorId = localStorage.getItem("wox-user-id") || "";

    const res = await fetch("/api/mongo/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: orderNum,
        userId: user?.id || visitorId || "",
        customerName: newAddress.name,
        customerPhone: newAddress.phone,
        customerEmail: user?.email || "",
        address: {
          name: newAddress.name,
          phone: newAddress.phone,
          line1: newAddress.line1,
          line2: newAddress.line2,
          city: newAddress.city,
          taluk: newAddress.taluk,
          district: newAddress.district,
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
        subtotal: subtotal - couponDiscount,
        shippingCost,
        tax,
        total,
        paymentMethod,
        paymentId: paymentId || "",
        paymentStatus: paymentId ? "PAID" : "PENDING",
        couponCode: appliedCoupon?.code || "",
        couponDiscount: couponDiscount,
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
    if (isBuyNow) {
      sessionStorage.removeItem("wox-buy-now");
    } else {
      clearCart();
    }
    // Auto-save address to saved addresses if not already saved
    if (newAddress.name && newAddress.phone && newAddress.line1 && newAddress.city && newAddress.taluk && newAddress.district && newAddress.state && newAddress.pincode) {
      const existing = getSavedAddresses();
      const alreadySaved = existing.some(
        (a) => a.house === newAddress.line1 && a.town === newAddress.city && a.pincode === newAddress.pincode && a.name === newAddress.name
      );
      if (!alreadySaved) {
        const newSaved: SavedAddress = {
          id: `addr-${Date.now()}`,
          name: newAddress.name,
          phone: newAddress.phone,
          house: newAddress.line1,
          street: newAddress.line2,
          town: newAddress.city,
          taluk: newAddress.taluk,
          district: newAddress.district,
          state: newAddress.state,
          country: "India",
          pincode: newAddress.pincode,
          landmark: newAddress.landmark,
        };
        saveSavedAddresses([...existing, newSaved]);
      }
    }
    setCurrentStep(5);
  }

  function handleSelectSavedAddress(addr: SavedAddress) {
    setSelectedSavedId(addr.id);
    setNewAddress({
      id: addr.id,
      name: addr.name,
      phone: addr.phone,
      line1: addr.house,
      line2: addr.street,
      city: addr.town,
      taluk: addr.taluk || "",
      district: addr.district,
      state: addr.state,
      pincode: addr.pincode,
      landmark: addr.landmark,
    });
    setFieldErrors({});
    setShakingFields({});
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
    if (currentStep === 1) {
      if (!validateAddressFields()) return;
    }
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
    setNewAddress((prev) => ({ ...prev, pincode, city: "", taluk: "", state: "", district: "" }));
    clearFieldError("pincode");
    setPincodeError("");

    if (pincode.length !== 6) return;

    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();

      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const offices = data[0].PostOffice;
        const deliveryOffice =
          offices.find((po: Record<string, string>) => po.DeliveryStatus === "Delivery" && po.BranchType === "Sub Post Office")
          || offices.find((po: Record<string, string>) => po.DeliveryStatus === "Delivery")
          || offices[0];
        const city = deliveryOffice.Name || "";
        const taluk = deliveryOffice.Block || "";
        const district = deliveryOffice.District || "";
        const state = deliveryOffice.State || "";

        const INDIAN_STATES = ["kerala","andhra pradesh","arunachal pradesh","assam","bihar","chhattisgarh","goa","gujarat","haryana","himachal pradesh","jharkhand","karnataka","madhya pradesh","maharashtra","manipur","meghalaya","mizoram","nagaland","odisha","punjab","rajasthan","sikkim","tamil nadu","telangana","tripura","uttar pradesh","uttarakhand","west bengal","andaman and nicobar islands","chandigarh","dadra and nagar haveli and daman and diu","delhi","jammu and kashmir","ladakh","lakshadweep","puducherry"];
        if (!INDIAN_STATES.includes(state.trim().toLowerCase())) {
          setPincodeError("This location is currently unavailable for delivery. Please change your pincode to a valid Indian pincode.");
          setNewAddress((prev) => ({ ...prev, pincode, city: "", taluk: "", district: "", state: "" }));
          return;
        }

        setNewAddress((prev) => ({ ...prev, city, taluk, district, state }));
        clearFieldError("city");
        clearFieldError("taluk");
        clearFieldError("district");
        clearFieldError("state");
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

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          cartItems: items.map((item) => ({
            slug: item.slug,
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: data.code, discount: data.discount });
        setCouponError("");
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || "Invalid coupon code");
      }
    } catch {
      setAppliedCoupon(null);
      setCouponError("Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
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
    <div ref={checkoutRef} className="min-h-screen bg-white pb-24 lg:pb-0" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
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

                {/* Saved Addresses */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-500">Choose a saved address or enter a new one.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={cn(
                            "rounded-lg border p-4 text-left transition-all",
                            selectedSavedId === addr.id
                              ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                              : "border-zinc-200 hover:border-zinc-400"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className={cn("mt-0.5 h-4 w-4 flex-shrink-0", selectedSavedId === addr.id ? "text-zinc-900" : "text-zinc-400")} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900">{addr.name} · {addr.phone}</p>
                              <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{formatAddressShort(addr)}</p>
                            </div>
                            {selectedSavedId === addr.id && (
                              <Check className="h-4 w-4 flex-shrink-0 text-zinc-900" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="relative flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="text-xs text-zinc-400">or enter new address</span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>
                  </div>
                )}

                {savedAddresses.length === 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                    <Plus className="h-4 w-4" />
                    <span>Enter your address below — it will be saved for next time.</span>
                  </div>
                )}

                <div className="rounded-lg border border-zinc-200 p-5">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {selectedSavedId ? "Edit selected address" : "Enter your delivery address"}
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
                          className={cn(shakingFields.pincode && "animate-shake-field", fieldErrors.pincode && !shakingFields.pincode && "field-error")}
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
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, "").slice(0, 10) });
                          clearFieldError("phone");
                        }}
                        placeholder="10-digit mobile number"
                        className={cn("mt-1", shakingFields.phone && "animate-shake-field", fieldErrors.phone && !shakingFields.phone && "field-error")}
                        maxLength={10}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-600">
                        Full Name *
                      </label>
                      <Input
                        value={newAddress.name}
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, name: e.target.value });
                          clearFieldError("name");
                        }}
                        placeholder="Full name"
                        className={cn("mt-1", shakingFields.name && "animate-shake-field", fieldErrors.name && !shakingFields.name && "field-error")}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-600">
                        House / Flat / Building *
                      </label>
                      <Input
                        value={newAddress.line1}
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, line1: e.target.value });
                          clearFieldError("line1");
                        }}
                        placeholder="House no., Flat no., Building name"
                        className={cn("mt-1", shakingFields.line1 && "animate-shake-field", fieldErrors.line1 && !shakingFields.line1 && "field-error")}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-600">
                        Street / Area / Landmark *
                      </label>
                      <Input
                        value={newAddress.line2}
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, line2: e.target.value });
                          clearFieldError("line2");
                        }}
                        placeholder="Street, Area, Sector, Landmark"
                        className={cn("mt-1", shakingFields.line2 && "animate-shake-field", fieldErrors.line2 && !shakingFields.line2 && "field-error")}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        City / Town *
                      </label>
                      <Input
                        value={newAddress.city}
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, city: e.target.value });
                          clearFieldError("city");
                        }}
                        placeholder={pincodeLoading ? "Fetching..." : "City or Town"}
                        className={cn("mt-1", shakingFields.city && "animate-shake-field", fieldErrors.city && !shakingFields.city && "field-error")}
                        readOnly={pincodeLoading}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        Taluk *
                      </label>
                      <Input
                        value={newAddress.taluk}
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, taluk: e.target.value });
                          clearFieldError("taluk");
                        }}
                        placeholder={pincodeLoading ? "Fetching..." : "Taluk"}
                        className={cn("mt-1", shakingFields.taluk && "animate-shake-field", fieldErrors.taluk && !shakingFields.taluk && "field-error")}
                        readOnly={pincodeLoading}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        District *
                      </label>
                      <Input
                        value={newAddress.district}
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, district: e.target.value });
                          clearFieldError("district");
                        }}
                        placeholder={pincodeLoading ? "Fetching..." : "District"}
                        className={cn("mt-1", shakingFields.district && "animate-shake-field", fieldErrors.district && !shakingFields.district && "field-error")}
                        readOnly={pincodeLoading}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600">
                        State *
                      </label>
                      <Input
                        value={newAddress.state}
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, state: e.target.value });
                          clearFieldError("state");
                        }}
                        placeholder={pincodeLoading ? "Fetching..." : "State"}
                        className={cn("mt-1", shakingFields.state && "animate-shake-field", fieldErrors.state && !shakingFields.state && "field-error")}
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
                          {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
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
                          {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
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
                      Please keep exact change ready at the time of delivery.
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
                        {selectedAddress.city}{selectedAddress.taluk ? `, ${selectedAddress.taluk}` : ""}{selectedAddress.district ? `, ${selectedAddress.district}` : ""} — {selectedAddress.state} -{" "}
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
                {isOutsideIndia && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    Currently unavailable for this location. We only deliver within India.
                  </div>
                )}
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
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                      className="h-9 flex-1 text-xs"
                    />
                    {appliedCoupon ? (
                      <button onClick={removeCoupon} className="shrink-0 rounded border border-green-300 bg-green-50 px-3 text-xs font-medium text-green-700 hover:bg-green-100">
                        Applied ✓
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponLoading}
                        className="shrink-0 rounded border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}
                  {appliedCoupon && <p className="text-[11px] text-green-600">Coupon applied! You save {formatPrice(appliedCoupon.discount)}</p>}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-zinc-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Coupon Discount</span>
                      <span className="text-green-600">-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
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
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                      className="h-9 flex-1 text-xs"
                    />
                    {appliedCoupon ? (
                      <button onClick={removeCoupon} className="shrink-0 rounded border border-green-300 bg-green-50 px-3 text-xs font-medium text-green-700 hover:bg-green-100">
                        Applied ✓
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponLoading}
                        className="shrink-0 rounded border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}
                  {appliedCoupon && <p className="text-[11px] text-green-600">Coupon applied! You save {formatPrice(appliedCoupon.discount)}</p>}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-zinc-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Coupon Discount</span>
                      <span className="text-green-600">-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
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
