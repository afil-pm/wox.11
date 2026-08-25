"use client";

import Link from "next/link";
import { Heart, ShoppingBag, X } from "lucide-react";
import { useWishlistStore } from "@/lib/stores/wishlist";
import useCartStore from "@/lib/stores/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  const isEmpty = items.length === 0;

  const handleAddToCart = (item: (typeof items)[number]) => {
    addItem({
      productId: item.productId,
      name: item.name,
      slug: item.slug,
      price: item.salePrice ?? item.price,
      image: item.image,
      size: "M",
      sizeId: "default",
      quantity: 1,
      maxQuantity: 10,
    });
    removeItem(item.productId);
  };

  const handleMoveAllToCart = () => {
    items.forEach((item) => {
      addItem({
        productId: item.productId,
        name: item.name,
        slug: item.slug,
        price: item.salePrice ?? item.price,
        image: item.image,
        size: "M",
        sizeId: "default",
        quantity: 1,
        maxQuantity: 10,
      });
    });
    clearWishlist();
  };

  if (isEmpty) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <Heart className="mb-6 h-16 w-16 text-zinc-300" />
        <h1 className="text-xl font-bold uppercase tracking-wider text-zinc-900">
          Your Wishlist is Empty
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Save your favorite items here.
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-zinc-900 sm:text-3xl">
            My Wishlist ({items.length}{" "}
            {items.length === 1 ? "item" : "items"})
          </h1>
          <Button variant="outline" onClick={handleMoveAllToCart}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Move All to Cart
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
          {items.map((item) => (
            <div key={item.productId} className="group flex flex-col">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-100">
                <Link href={`/${item.gender || "men"}/${item.category || "shirts"}/${item.slug}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zinc-500 opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-zinc-900 group-hover:opacity-100"
                  aria-label="Remove from wishlist"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-1 flex-col">
                <Link
                  href={`/${item.gender || "men"}/${item.category || "shirts"}/${item.slug}`}
                  className="text-sm font-medium text-zinc-900 hover:underline"
                >
                  {item.name}
                </Link>

                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {formatPrice(item.salePrice ?? item.price)}
                </p>

                <div className="mt-auto flex gap-2 pt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAddToCart(item)}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 flex-shrink-0 text-zinc-400 hover:text-red-500"
                    onClick={() => removeItem(item.productId)}
                    aria-label="Remove from wishlist"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
