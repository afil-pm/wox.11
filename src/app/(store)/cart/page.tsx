"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingBag, Tag, Shield } from "lucide-react";
import useCartStore from "@/lib/stores/cart";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSavedAddresses } from "@/app/(store)/account/addresses/page";

const FREE_SHIPPING_THRESHOLD = 999;
const ESTIMATED_TAX_RATE = 0.05;

export default function CartPage() {
  const { items, totalItems, subtotal, removeItem, updateQuantity } =
    useCartStore();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingLoading, setShippingLoading] = useState(false);

  const fetchShipping = useCallback(async () => {
    try {
      const addresses = getSavedAddresses();
      const addr = addresses[0];
      if (!addr?.pincode || !/^\d{6}$/.test(addr.pincode)) {
        setShippingCost(0);
        return;
      }
      setShippingLoading(true);
      const res = await fetch(`/api/shipping/validate-pincode?pincode=${encodeURIComponent(addr.pincode)}`);
      const data = await res.json();
      if (data.shippingCost >= 0) {
        setShippingCost(data.shippingCost);
      } else {
        setShippingCost(0);
      }
    } catch {
      setShippingCost(0);
    } finally {
      setShippingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipping();
  }, [fetchShipping, items]);

  const isEmpty = items.length === 0;
  const shipping = isEmpty ? 0 : shippingCost;
  const discount = appliedCoupon?.discount ?? 0;
  const tax = Math.round((subtotal - discount) * ESTIMATED_TAX_RATE);
  const total = Math.max(subtotal - discount + shipping + tax, 0);

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "WOX10") {
      setAppliedCoupon({ code: "WOX10", discount: Math.round(subtotal * 0.1) });
    }
  };

  if (isEmpty) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <ShoppingBag className="mb-6 h-16 w-16 text-zinc-300" />
        <h1 className="text-xl font-bold uppercase tracking-wider text-zinc-900">
          Your Cart is Empty
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold uppercase tracking-wider text-zinc-900 sm:text-3xl">
          Shopping Bag ({totalItems} {totalItems === 1 ? "item" : "items"})
        </h1>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-lg border border-zinc-200 p-4 sm:gap-6"
              >
                <Link
                  href={`/${item.gender || "men"}/${item.category || "shirts"}/${item.slug}`}
                  className="relative h-[100px] w-[80px] flex-shrink-0 overflow-hidden rounded-md bg-zinc-100"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/${item.gender || "men"}/${item.category || "shirts"}/${item.slug}`}
                        className="text-sm font-medium text-zinc-900 hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Size: {item.size}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div className="flex items-center rounded-md border border-zinc-200">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center text-zinc-600 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-300"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-zinc-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.maxQuantity}
                        className="flex h-8 w-8 items-center justify-center text-zinc-600 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-300"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-[380px] lg:flex-shrink-0">
            <div className="sticky top-24 rounded-lg border border-zinc-200 p-6">
              <h2 className="mb-6 text-lg font-bold uppercase tracking-wider text-zinc-900">
                Order Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Subtotal ({totalItems} items)
                  </span>
                  <span className="font-medium text-zinc-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">
                      Discount ({appliedCoupon.code})
                    </span>
                    <span className="font-medium text-green-600">
                      -{formatPrice(discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Shipping</span>
                  <span className="font-medium text-zinc-900">
                    {shippingLoading ? (
                      <span className="h-4 w-4 inline-block animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                    ) : shipping === 0 ? (
                      "Free"
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Estimated Tax</span>
                  <span className="font-medium text-zinc-900">
                    {formatPrice(tax)}
                  </span>
                </div>

                <div className="border-t border-zinc-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-zinc-900">
                      Total
                    </span>
                    <span className="text-base font-bold text-zinc-900">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="h-10 flex-1 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                >
                  Apply
                </Button>
              </div>

              <Button asChild className="mt-5 h-12 w-full text-base">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900"
                >
                  Continue Shopping
                </Link>
              </div>

              <div className="mt-6 flex items-center justify-center gap-1.5 text-zinc-400">
                <Shield className="h-4 w-4" />
                <span className="text-xs">Secure Checkout</span>
              </div>

              <p className="mt-3 text-center text-xs text-zinc-400">
                100% Money-back Guarantee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
