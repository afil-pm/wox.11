"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useRecentlyViewed } from "@/lib/hooks/use-recently-viewed";

export default function RecentlyViewed() {
  const { items, clearRecent } = useRecentlyViewed();
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const syncEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setEdges({
      start: rail.scrollLeft <= 4,
      end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    syncEdges();
    rail.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    return () => {
      rail.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
    };
  }, [items.length, syncEdges]);

  if (items.length === 0) return null;

  const slide = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.8, 240),
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-zinc-400" />
            <h2 className="text-2xl font-bold uppercase tracking-wider text-zinc-900 sm:text-3xl">
              Recently Viewed
            </h2>
          </div>
          <button
            onClick={clearRecent}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>

        <div className="relative mt-8">
          <div
            ref={railRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          >
            {items.map((item) => {
              const hasDiscount = item.salePrice != null && item.salePrice > 0 && item.salePrice < item.price;
              const discount = hasDiscount ? Math.round(((item.price - item.salePrice!) / item.price) * 100) : 0;
              const displayPrice = hasDiscount ? item.salePrice! : item.price;
              const categorySlug = item.category.toLowerCase().replace(/['\s]+/g, "-");
              const href = `/${item.gender.toLowerCase()}/${categorySlug}/${item.slug}`;

              return (
                <Link
                  key={item.slug}
                  href={href}
                  className="group flex-shrink-0 w-40 sm:w-52"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 rounded-lg">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="208px"
                    />
                    {discount > 0 && (
                      <div className="absolute left-2 top-2 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        -{discount}%
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-zinc-400 line-clamp-1">{item.category}</p>
                    <p className="mt-0.5 text-sm font-medium text-zinc-900 line-clamp-2 group-hover:text-zinc-600 transition-colors">
                      {item.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900">
                        {formatPrice(displayPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-zinc-400 line-through">
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Desktop-only slide controls: they fade away at the ends of the rail. */}
          <button
            type="button"
            aria-label="Scroll left"
            title="Scroll left"
            onClick={() => slide(-1)}
            className={cn(
              "absolute -left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 lg:flex",
              edges.start && "pointer-events-none opacity-0"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            title="Scroll right"
            onClick={() => slide(1)}
            className={cn(
              "absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 lg:flex",
              edges.end && "pointer-events-none opacity-0"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
