"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  averageRating: number;
  reviewCount: number;
  images: { url: string; alt: string }[];
  category: { name: string; gender: string };
};

type Props = {
  category: string;
  gender: string;
  excludeSlug: string;
};

export default function RelatedProducts({ category, gender, excludeSlug }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const res = await fetch(
          `/api/products/related?category=${encodeURIComponent(category)}&gender=${encodeURIComponent(gender)}&exclude=${excludeSlug}`
        );
        const data = await res.json();
        setProducts(data.products || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchRelated();
  }, [category, gender, excludeSlug]);

  if (loading || products.length === 0) return null;

  return (
    <section className="border-t border-zinc-100 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-900 sm:text-2xl">
          Similar Products
        </h2>
        <p className="mt-1 text-sm text-zinc-500">You might also like these</p>

        <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {products.map((product) => {
            const hasDiscount = product.salePrice != null && product.salePrice > 0 && product.salePrice < product.basePrice;
            const displayPrice = hasDiscount ? product.salePrice! : product.basePrice;
            const discount = hasDiscount ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100) : 0;
            const categorySlug = product.category.name.toLowerCase().replace(/['\s]+/g, "-");
            const href = `/${product.category.gender.toLowerCase()}/${categorySlug}/${product.slug}`;
            const img = product.images[0]?.url || "/images/placeholder.png";

            return (
              <Link
                key={product.id}
                href={href}
                className="group flex-shrink-0 w-40 sm:w-52"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 rounded-lg">
                  <Image
                    src={img}
                    alt={product.name}
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
                  <p className="text-xs text-zinc-400 line-clamp-1">{product.category.name}</p>
                  <p className="mt-0.5 text-sm font-medium text-zinc-900 line-clamp-2 group-hover:text-zinc-600 transition-colors">
                    {product.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900">
                      {formatPrice(displayPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-zinc-400 line-through">
                        {formatPrice(product.basePrice)}
                      </span>
                    )}
                  </div>
                  {product.averageRating > 0 && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <svg
                            key={i}
                            className={`h-3 w-3 ${i <= Math.round(product.averageRating) ? "text-amber-400" : "text-zinc-200"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-400">({product.reviewCount})</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
