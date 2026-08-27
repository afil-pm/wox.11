"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Minus, Plus, Truck, Shield, CreditCard } from "lucide-react";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ProductImage = { url: string; alt: string | null };

type BuyNowProduct = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  salePrice: number | null;
  category: string;
  gender: string;
  sizes: { name: string; quantity: number }[];
};

type Props = {
  product: BuyNowProduct;
  open: boolean;
  onClose: () => void;
};

export default function BuyNowModal({ product, open, onClose }: Props) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
      });
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const displayPrice = product.salePrice || product.price;
  const discount = calculateDiscount(product.price, product.salePrice ?? product.price);
  const selectedSizeData = product.sizes.find((s) => s.name === selectedSize);
  const stock = selectedSizeData?.quantity ?? 0;

  function handleBuyNow() {
    const stored = localStorage.getItem("wox-user");
    if (!stored || !JSON.parse(stored)?.email) {
      window.location.href = "/auth/login";
      return;
    }
    if (!selectedSize) return;
    setLoading(true);
    const buyNowItem = {
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: displayPrice,
      size: selectedSize,
      sizeId: selectedSize,
      quantity,
      category: product.category,
      gender: product.gender,
      buyNow: true,
    };
    sessionStorage.setItem("wox-buy-now", JSON.stringify(buyNowItem));
    window.location.href = "/checkout?buyNow=true";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        ref={scrollRef}
        className="flex max-h-[92dvh] w-full flex-col overflow-y-auto overscroll-contain rounded-t-2xl bg-white shadow-2xl sm:max-h-[90dvh] sm:max-w-md sm:rounded-2xl"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-zinc-100 bg-white px-5 py-4">
          <h3 className="text-base font-semibold text-zinc-900">Buy Now</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-zinc-100 transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="px-5 py-4">
          <div className="flex gap-4">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
              <Image src={product.image} alt={product.name} fill className="object-cover" sizes="96px" />
              {discount > 0 && (
                <div className="absolute left-1 top-1 rounded bg-zinc-900 px-1 py-0.5 text-[9px] font-bold text-white">
                  -{discount}%
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400">{product.category}</p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900 line-clamp-2">{product.name}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold text-zinc-900">{formatPrice(displayPrice)}</span>
                {product.salePrice && (
                  <span className="text-sm text-zinc-400 line-through">{formatPrice(product.price)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Size Selection */}
        <div className="border-t border-zinc-100 px-5 py-4">
          <p className="text-xs font-medium text-zinc-600 mb-2">Select Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const available = size.quantity > 0;
              return (
                <button
                  key={size.name}
                  onClick={() => available && setSelectedSize(size.name)}
                  disabled={!available}
                  className={cn(
                    "h-9 min-w-[36px] rounded-lg border px-3 text-xs font-semibold transition-all",
                    selectedSize === size.name
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : available
                        ? "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                        : "border-zinc-100 text-zinc-300 cursor-not-allowed line-through"
                  )}
                >
                  {size.name}
                </button>
              );
            })}
          </div>
          {!selectedSize && (
            <p className="mt-2 text-xs text-zinc-400">Please select a size</p>
          )}
        </div>

        {/* Quantity */}
        <div className="border-t border-zinc-100 px-5 py-4">
          <p className="text-xs font-medium text-zinc-600 mb-2">Quantity</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-zinc-200">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-9 w-9 items-center justify-center text-zinc-600 hover:bg-zinc-50"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="flex h-9 w-10 items-center justify-center text-sm font-semibold text-zinc-900 border-x border-zinc-200">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                disabled={quantity >= stock}
                className="flex h-9 w-9 items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-30"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {selectedSize && (
              <span className="text-xs text-zinc-400">
                {stock > 10 ? "In Stock" : stock > 0 ? `Only ${stock} left` : "Out of Stock"}
              </span>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="border-t border-zinc-100 px-5 py-3">
          <div className="flex items-center gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Free Delivery</span>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> 7-day Returns</span>
            <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Secure Pay</span>
          </div>
        </div>

        {/* Buy Button - sticky bottom on mobile so always reachable */}
        <div className="sticky bottom-0 border-t border-zinc-100 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button
            onClick={handleBuyNow}
            disabled={!selectedSize || loading}
            className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-12 text-sm font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </span>
            ) : (
              `Pay ${formatPrice(displayPrice * quantity)} — Buy Now`
            )}
          </Button>
          <p className="mt-3 text-center text-[11px] text-zinc-400">
            You&apos;ll be redirected to checkout
          </p>
        </div>
      </div>
    </div>
  );
}
