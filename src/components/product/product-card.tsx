"use client";

import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { useWishlistStore } from "@/lib/stores/wishlist";


interface ProductImage {
  url: string;
  alt: string;
}

interface ProductCategory {
  name: string;
  gender: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  averageRating: number;
  reviewCount: number;
  images: ProductImage[];
  category: ProductCategory;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const hasDiscount =
    product.salePrice !== null && product.salePrice < product.basePrice;
  const discount = hasDiscount
    ? calculateDiscount(product.basePrice, product.salePrice!)
    : 0;

  const { items, toggleItem } = useWishlistStore();
  const isWishlisted = items.some((i) => i.productId === product.id);

  const productHref =
    product.category.gender === "men"
      ? `/men/${product.category.name.toLowerCase().replace("'", "").replace(" ", "-")}/${product.slug}`
      : `/boys/${product.category.name.toLowerCase().replace("'", "").replace(" ", "-")}/${product.slug}`;

  return (
    <Link
      href={productHref}
      className={cn(
        "group relative flex flex-col overflow-hidden bg-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 tap-highlight-none active:scale-[0.98]",
        className
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
        {product.images[0] ? (
          <img src={product.images[0].url} alt={product.images[0].alt || product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-wider">
              No Image
            </span>
          </div>
        )}

        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            -{discount}%
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleItem({
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: product.salePrice ?? product.basePrice,
              image: product.images[0]?.url || "",
            });
          }}
          className={cn(
            "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95",
            isWishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isWishlisted
                ? "fill-red-500 text-red-500"
                : "text-zinc-600"
            )}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {product.category.gender === "men" ? "Men's" : "Boys'"}{" "}
          {product.category.name}
        </p>

        <h3 className="line-clamp-2 text-sm font-medium text-zinc-900 group-hover:text-zinc-600">
          {product.name}
        </h3>

        <div className="mt-auto flex items-center gap-1">
          <Star className="h-3 w-3 fill-zinc-900 text-zinc-900" />
          <span className="text-xs font-medium text-zinc-900">
            {product.averageRating}
          </span>
          <span className="text-xs text-zinc-500">
            ({product.reviewCount})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900">
            {formatPrice(product.salePrice ?? product.basePrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-zinc-500 line-through">
              {formatPrice(product.basePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
