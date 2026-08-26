"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard, type Product } from "@/components/product/product-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = ["All", "Shirts", "T-Shirts", "Pants"];
const sizes = ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y", "14-15Y"];
const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low", "Newest"];

const products: Product[] = [
  {
    id: "1",
    name: "WOX Boys' Denim Shirt",
    slug: "wox-boys-denim-shirt",
    basePrice: 1399,
    salePrice: 1099,
    images: [
      { url: "/images/products/boys/shirts/wox-boys-denim-shirt-1.png", alt: "WOX Boys' Denim Shirt" },
      { url: "/images/products/boys/shirts/wox-boys-denim-shirt-2.png", alt: "WOX Boys' Denim Shirt" },
    ],
    averageRating: 4.5,
    reviewCount: 42,
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "2",
    name: "WOX Boys' Khaki Solid Shirt",
    slug: "wox-boys-khaki-shirt",
    basePrice: 1199,
    salePrice: 899,
    images: [
      { url: "/images/products/boys/shirts/wox-boys-khaki-shirt-1.png", alt: "WOX Boys' Khaki Solid Shirt" },
      { url: "/images/products/boys/shirts/wox-boys-khaki-shirt-2.png", alt: "WOX Boys' Khaki Solid Shirt" },
    ],
    averageRating: 4.3,
    reviewCount: 35,
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "3",
    name: "WOX Boys' Olive Green Shirt",
    slug: "wox-boys-olive-shirt",
    basePrice: 1299,
    salePrice: 999,
    images: [
      { url: "/images/products/boys/shirts/wox-boys-olive-shirt-1.png", alt: "WOX Boys' Olive Green Shirt" },
      { url: "/images/products/boys/shirts/wox-boys-olive-shirt-2.png", alt: "WOX Boys' Olive Green Shirt" },
    ],
    averageRating: 4.6,
    reviewCount: 58,
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "4",
    name: "WOX Boys' Grey Textured Sweatshirt",
    slug: "wox-boys-grey-sweatshirt",
    basePrice: 999,
    salePrice: 799,
    images: [
      { url: "/images/products/boys/t-shirts/wox-boys-grey-sweatshirt-1.png", alt: "WOX Boys' Grey Textured Sweatshirt" },
      { url: "/images/products/boys/t-shirts/wox-boys-grey-sweatshirt-2.png", alt: "WOX Boys' Grey Textured Sweatshirt" },
    ],
    averageRating: 4.4,
    reviewCount: 67,
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "5",
    name: "WOX Boys' Navy Graphic Oversized Tee",
    slug: "wox-boys-navy-graphic-tee",
    basePrice: 899,
    salePrice: null,
    images: [
      { url: "/images/products/boys/t-shirts/wox-boys-navy-graphic-tee-1.png", alt: "WOX Boys' Navy Graphic Oversized Tee" },
      { url: "/images/products/boys/t-shirts/wox-boys-navy-graphic-tee-2.png", alt: "WOX Boys' Navy Graphic Oversized Tee" },
    ],
    averageRating: 4.2,
    reviewCount: 45,
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "6",
    name: "WOX Boys' Olive Oversized Tee",
    slug: "wox-boys-olive-tee",
    basePrice: 799,
    salePrice: null,
    images: [
      { url: "/images/products/boys/t-shirts/wox-boys-olive-tee-1.png", alt: "WOX Boys' Olive Oversized Tee" },
      { url: "/images/products/boys/t-shirts/wox-boys-olive-tee-2.png", alt: "WOX Boys' Olive Oversized Tee" },
    ],
    averageRating: 4.5,
    reviewCount: 38,
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "7",
    name: "WOX Boys' Black Wide-Leg Jeans",
    slug: "wox-boys-black-wide-leg-jeans",
    basePrice: 1499,
    salePrice: 1199,
    images: [
      { url: "/images/products/boys/pants/wox-boys-black-wide-leg-jeans-1.png", alt: "WOX Boys' Black Wide-Leg Jeans" },
      { url: "/images/products/boys/pants/wox-boys-black-wide-leg-jeans-2.png", alt: "WOX Boys' Black Wide-Leg Jeans" },
    ],
    averageRating: 4.7,
    reviewCount: 29,
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "8",
    name: "WOX Boys' Dark Grey Jeans",
    slug: "wox-boys-dark-grey-jeans",
    basePrice: 1399,
    salePrice: null,
    images: [
      { url: "/images/products/boys/pants/wox-boys-dark-grey-jeans-1.png", alt: "WOX Boys' Dark Grey Jeans" },
      { url: "/images/products/boys/pants/wox-boys-dark-grey-jeans-2.png", alt: "WOX Boys' Dark Grey Jeans" },
    ],
    averageRating: 4.4,
    reviewCount: 52,
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "9",
    name: "WOX Boys' Grey Flame Print Joggers",
    slug: "wox-boys-grey-flame-joggers",
    basePrice: 1099,
    salePrice: null,
    images: [
      { url: "/images/products/boys/pants/wox-boys-grey-flame-joggers-1.png", alt: "WOX Boys' Grey Flame Print Joggers" },
      { url: "/images/products/boys/pants/wox-boys-grey-flame-joggers-2.png", alt: "WOX Boys' Grey Flame Print Joggers" },
    ],
    averageRating: 4.6,
    reviewCount: 33,
    category: { name: "Pants", gender: "boys" },
  },
];

const ITEMS_PER_PAGE = 6;

export default function BoysPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState("Featured");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = products.filter((p) => {
    if (selectedCategory !== "All" && p.category.name !== selectedCategory) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aPrice = a.salePrice ?? a.basePrice;
    const bPrice = b.salePrice ?? b.basePrice;
    switch (selectedSort) {
      case "Price: Low to High":
        return aPrice - bPrice;
      case "Price: High to Low":
        return bPrice - aPrice;
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeFilters = [
    selectedCategory !== "All" ? selectedCategory : null,
    selectedSize,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-wider text-zinc-900">BOYS</h1>
          <p className="mt-2 text-zinc-500">
            Quality clothing for boys aged 4–15
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Filter bar */}
        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-zinc-200 pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Category <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories.map((cat) => (
                <DropdownMenuItem key={cat} onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}>
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Size <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {sizes.map((size) => (
                <DropdownMenuItem key={size} onClick={() => { setSelectedSize(size); setCurrentPage(1); }}>
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Sort by: {selectedSort} <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {sortOptions.map((opt) => (
                  <DropdownMenuItem key={opt} onClick={() => setSelectedSort(opt)}>
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
            {activeFilters.map((f) => (
              <Badge key={f} variant="secondary" className="cursor-pointer" onClick={() => {
                if (f === selectedCategory) setSelectedCategory("All");
                if (f === selectedSize) setSelectedSize(null);
              }}>
                {f} <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedCategory("All"); setSelectedSize(null); setCurrentPage(1); }}
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Results count */}
        <p className="mb-6 text-sm text-zinc-500">
          Showing {paginated.length} of {sorted.length} products
        </p>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {paginated.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-zinc-500">No products match your filters.</p>
            <Button
              variant="link"
              onClick={() => { setSelectedCategory("All"); setSelectedSize(null); setCurrentPage(1); }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
