"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Trash2, X } from "lucide-react";
import { useRecentlyViewed } from "@/lib/hooks/use-recently-viewed";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";

export default function HistoryPage() {
  const { items, hydrated, removeItem, clearRecent } = useRecentlyViewed();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!confirmOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirmOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 h-9 w-56 animate-pulse rounded bg-zinc-100" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-3">
                <div className="aspect-[3/4] animate-pulse rounded-lg bg-zinc-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <History className="mb-6 h-16 w-16 text-zinc-300" />
        <h1 className="text-xl font-bold uppercase tracking-wider text-zinc-900">
          No recently viewed products.
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Products you view will show up here.
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
        <BackButton href="/" className="mb-4" />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-zinc-900 sm:text-3xl">
            Recently Viewed ({items.length}{" "}
            {items.length === 1 ? "item" : "items"})
          </h1>
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
          {items.map((item) => {
            const href = `/${item.gender.toLowerCase()}/${item.category
              .toLowerCase()
              .replace(/['\s]+/g, "-")}/${item.slug}`;
            const basePrice = item.price;
            const salePrice = item.salePrice;
            const hasDiscount =
              salePrice != null && salePrice > 0 && salePrice < basePrice;
            const discountPercent = hasDiscount
              ? Math.round(((basePrice - salePrice) / basePrice) * 100)
              : 0;
            const displayPrice = hasDiscount ? salePrice : basePrice;

            return (
              <div key={item.slug} className="group flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-100">
                  <Link href={href}>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                  {hasDiscount && (
                    <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                      -{discountPercent}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.slug)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zinc-500 opacity-100 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-zinc-900 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Remove ${item.name} from history`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-1 flex-col">
                  <Link
                    href={href}
                    className="line-clamp-2 text-sm font-medium text-zinc-900 hover:underline"
                  >
                    {item.name}
                  </Link>

                  <p className="mt-1 text-xs text-zinc-500">{item.category}</p>

                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {formatPrice(displayPrice)}
                    {hasDiscount && (
                      <span className="ml-2 text-xs font-normal text-zinc-400 line-through">
                        {formatPrice(basePrice)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-history-title"
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                <Trash2 className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
              </div>
              <h2
                id="clear-history-title"
                className="text-xl font-bold tracking-tight text-zinc-900"
              >
                Clear recently viewed products?
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Are you sure you want to clear your recently viewed products?
              </p>
            </div>
            <div className="flex border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <div className="w-px bg-zinc-100" />
              <button
                type="button"
                onClick={() => {
                  clearRecent();
                  setConfirmOpen(false);
                }}
                className="flex-1 px-4 py-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
