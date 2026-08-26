"use client";

import { useState, useMemo } from "react";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard, type Product } from "@/components/product/product-card";

const products: Product[] = [
  {
    id: "m-t-1",
    name: "WOX Essential Black Oversized T-Shirt",
    slug: "wox-essential-black-oversized-t-shirt",
    basePrice: 899,
    salePrice: 699,
    averageRating: 4.9,
    reviewCount: 203,
    images: [
      { url: "/images/products/men/t-shirts/wox-essential-black-oversized-t-shirt-1.png", alt: "WOX Essential Black Oversized T-Shirt" },
      { url: "/images/products/men/t-shirts/wox-essential-black-oversized-t-shirt-2.png", alt: "WOX Essential Black Oversized T-Shirt" },
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "m-t-2",
    name: "WOX Minimal White Crew Neck",
    slug: "wox-minimal-white-crew-neck",
    basePrice: 999,
    salePrice: 799,
    averageRating: 4.6,
    reviewCount: 156,
    images: [
      { url: "/images/products/men/t-shirts/wox-minimal-white-crew-neck-1.png", alt: "WOX Minimal White Crew Neck" },
      { url: "/images/products/men/t-shirts/wox-minimal-white-crew-neck-2.png", alt: "WOX Minimal White Crew Neck" },
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "m-t-3",
    name: "WOX Premium Pima Cotton Polo",
    slug: "wox-premium-pima-cotton-polo",
    basePrice: 1499,
    salePrice: 1199,
    averageRating: 4.8,
    reviewCount: 92,
    images: [
      { url: "/images/products/men/t-shirts/wox-premium-pima-cotton-polo-1.png", alt: "WOX Premium Pima Cotton Polo" },
      { url: "/images/products/men/t-shirts/wox-premium-pima-cotton-polo-2.png", alt: "WOX Premium Pima Cotton Polo" },
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "m-t-4",
    name: "WOX Ribbed Henley",
    slug: "wox-ribbed-henley",
    basePrice: 1099,
    salePrice: 849,
    averageRating: 4.5,
    reviewCount: 78,
    images: [
      { url: "/images/products/men/t-shirts/wox-ribbed-henley-1.png", alt: "WOX Ribbed Henley" },
      { url: "/images/products/men/t-shirts/wox-ribbed-henley-2.png", alt: "WOX Ribbed Henley" },
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "m-t-5",
    name: "WOX Color Block Tee",
    slug: "wox-color-block-tee",
    basePrice: 899,
    salePrice: 699,
    averageRating: 4.4,
    reviewCount: 63,
    images: [
      { url: "/images/products/men/t-shirts/wox-color-block-tee-1.png", alt: "WOX Color Block Tee" },
      { url: "/images/products/men/t-shirts/wox-color-block-tee-2.png", alt: "WOX Color Block Tee" },
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
];

const sizes = ["S", "M", "L", "XL", "XXL"];
const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "popularity", label: "Popularity" },
];
const priceRanges = [
  { label: "Under ₹1,000", min: 0, max: 999 },
  { label: "₹1,000 - ₹1,500", min: 1000, max: 1500 },
  { label: "₹1,500 - ₹2,000", min: 1500, max: 2000 },
  { label: "Over ₹2,000", min: 2000, max: Infinity },
];
const PRODUCTS_PER_PAGE = 8;

export default function MenTShirtsPage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    size: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setCurrentPage(1);
  };

  const togglePriceRange = (index: number) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedSizes.length > 0) {
      result = result.filter(() => selectedSizes.length > 0);
    }

    if (selectedPriceRanges.length > 0) {
      result = result.filter((p) =>
        selectedPriceRanges.some((rangeIndex) => {
          const range = priceRanges[rangeIndex];
          const price = p.salePrice ?? p.basePrice;
          return price >= range.min && price <= range.max;
        })
      );
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => (a.salePrice ?? a.basePrice) - (b.salePrice ?? b.basePrice));
        break;
      case "price-high":
        result.sort((a, b) => (b.salePrice ?? b.basePrice) - (a.salePrice ?? a.basePrice));
        break;
      case "popularity":
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        break;
    }

    return result;
  }, [selectedSizes, selectedPriceRanges, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const clearAllFilters = () => {
    setSelectedSizes([]);
    setSelectedPriceRanges([]);
    setSortBy("relevance");
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedSizes.length > 0 || selectedPriceRanges.length > 0;

  const filterContent = (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          className="flex w-full items-center justify-between py-2 text-sm font-semibold uppercase tracking-wider text-zinc-900"
          onClick={() => toggleSection("price")}
        >
          Price Range
          {expandedSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.price && (
          <div className="mt-3 space-y-2">
            {priceRanges.map((range, index) => (
              <label
                key={range.label}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <input
                  type="checkbox"
                  checked={selectedPriceRanges.includes(index)}
                  onChange={() => togglePriceRange(index)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                {range.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200" />

      <div>
        <button
          type="button"
          className="flex w-full items-center justify-between py-2 text-sm font-semibold uppercase tracking-wider text-zinc-900"
          onClick={() => toggleSection("size")}
        >
          Size
          {expandedSections.size ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.size && (
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                  selectedSizes.includes(size)
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                )}
                onClick={() => toggleSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <>
          <div className="border-t border-zinc-200" />
          <Button variant="outline" className="w-full" onClick={clearAllFilters}>
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/men" className="hover:text-zinc-900">Men</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-900">T-Shirts</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            MEN&apos;S T-SHIRTS
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {filteredProducts.length} products
          </p>
        </div>

        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileFiltersOpen(true)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-xs text-white">
                {selectedSizes.length + selectedPriceRanges.length}
              </span>
            )}
          </Button>

          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="lg:hidden">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-8">
          <aside className="hidden w-64 flex-shrink-0 lg:block">{filterContent}</aside>

          <div className="flex-1">
            {paginatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Search className="h-12 w-12 text-zinc-300" />
                <h3 className="mt-4 text-lg font-medium text-zinc-900">No products found</h3>
                <p className="mt-2 text-sm text-zinc-500">Try adjusting your filters to find what you&apos;re looking for.</p>
                <Button variant="outline" className="mt-4" onClick={clearAllFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button key={i + 1} variant={currentPage === i + 1 ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </Button>
                ))}
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">Filters</h2>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="flex h-10 w-10 items-center justify-center text-zinc-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-6">{filterContent}</div>
          </div>
        </div>
      )}
    </div>
  );
}
