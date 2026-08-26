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
    name: "WOX Young Classic Shirt",
    slug: "wox-young-classic-shirt",
    basePrice: 1299,
    salePrice: 999,
    images: [
      { url: "/images/products/boys/shirts/wox-young-classic-shirt-1.png", alt: "Young Classic Shirt" },
      { url: "/images/products/boys/shirts/wox-young-classic-shirt-2.png", alt: "Young Classic Shirt" },
    ],
    averageRating: 4.5,
    reviewCount: 42,
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "2",
    name: "WOX Kids Casual Shirt",
    slug: "wox-kids-casual-shirt",
    basePrice: 999,
    salePrice: 799,
    images: [
      { url: "/images/products/boys/shirts/wox-kids-casual-shirt-1.png", alt: "Kids Casual Shirt" },
      { url: "/images/products/boys/shirts/wox-kids-casual-shirt-2.png", alt: "Kids Casual Shirt" },
    ],
    averageRating: 4.3,
    reviewCount: 35,
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "3",
    name: "WOX School Formal Shirt",
    slug: "wox-school-formal-shirt",
    basePrice: 1199,
    salePrice: 899,
    images: [
      { url: "/images/products/boys/shirts/wox-school-formal-shirt-1.png", alt: "School Formal Shirt" },
      { url: "/images/products/boys/shirts/wox-school-formal-shirt-2.png", alt: "School Formal Shirt" },
    ],
    averageRating: 4.6,
    reviewCount: 58,
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "4",
    name: "WOX Young Essential Tee",
    slug: "wox-young-essential-tee",
    basePrice: 799,
    salePrice: 599,
    images: [
      { url: "/images/products/boys/t-shirts/wox-young-essential-tee-1.png", alt: "Young Essential Tee" },
      { url: "/images/products/boys/t-shirts/wox-young-essential-tee-2.png", alt: "Young Essential Tee" },
    ],
    averageRating: 4.4,
    reviewCount: 67,
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "5",
    name: "WOX Kids Graphic Tee",
    slug: "wox-kids-graphic-tee",
    basePrice: 699,
    salePrice: 499,
    images: [
      { url: "/images/products/boys/t-shirts/wox-kids-graphic-tee-1.png", alt: "Kids Graphic Tee" },
      { url: "/images/products/boys/t-shirts/wox-kids-graphic-tee-2.png", alt: "Kids Graphic Tee" },
    ],
    averageRating: 4.2,
    reviewCount: 45,
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "6",
    name: "WOX Sports Active Tee",
    slug: "wox-sports-active-tee",
    basePrice: 899,
    salePrice: 699,
    images: [
      { url: "/images/products/boys/t-shirts/wox-sports-active-tee-1.png", alt: "Sports Active Tee" },
      { url: "/images/products/boys/t-shirts/wox-sports-active-tee-2.png", alt: "Sports Active Tee" },
    ],
    averageRating: 4.5,
    reviewCount: 38,
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "7",
    name: "WOX Young Slim Fit Jeans",
    slug: "wox-young-slim-fit-jeans",
    basePrice: 1599,
    salePrice: 1299,
    images: [
      { url: "/images/products/boys/pants/wox-young-slim-fit-jeans-1.png", alt: "Young Slim Fit Jeans" },
      { url: "/images/products/boys/pants/wox-young-slim-fit-jeans-2.png", alt: "Young Slim Fit Jeans" },
    ],
    averageRating: 4.7,
    reviewCount: 29,
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "8",
    name: "WOX Kids Comfort Joggers",
    slug: "wox-kids-comfort-joggers",
    basePrice: 1299,
    salePrice: 999,
    images: [
      { url: "/images/products/boys/pants/wox-kids-comfort-joggers-1.png", alt: "Kids Comfort Joggers" },
      { url: "/images/products/boys/pants/wox-kids-comfort-joggers-2.png", alt: "Kids Comfort Joggers" },
    ],
    averageRating: 4.4,
    reviewCount: 52,
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "9",
    name: "WOX School Formal Pants",
    slug: "wox-school-formal-pants",
    basePrice: 1499,
    salePrice: 1199,
    images: [
      { url: "/images/products/boys/pants/wox-school-formal-pants-1.png", alt: "School Formal Pants" },
      { url: "/images/products/boys/pants/wox-school-formal-pants-2.png", alt: "School Formal Pants" },
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
