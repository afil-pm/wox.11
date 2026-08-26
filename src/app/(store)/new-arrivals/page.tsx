"use client";

import { useState, useMemo } from "react";
import { ChevronDown, SlidersHorizontal, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard, type Product } from "@/components/product/product-card";

const products: Product[] = [
  {
    id: "1",
    name: "WOX Premium Linen Overshirt",
    slug: "wox-premium-linen-overshirt",
    basePrice: 2499,
    salePrice: null,
    images: [{ url: "/images/products/men/shirts/wox-casual-linen-check-shirt-1.png", alt: "Premium Linen Overshirt" }],
    averageRating: 4.7,
    reviewCount: 18,
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "2",
    name: "WOX Summer Breeze Cotton Shirt",
    slug: "wox-summer-breeze-cotton-shirt",
    basePrice: 1899,
    salePrice: null,
    images: [{ url: "/images/products/men/shirts/wox-nautical-striped-shirt-1.png", alt: "Summer Breeze Cotton Shirt" }],
    averageRating: 4.5,
    reviewCount: 12,
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "3",
    name: "WOX New Wave Graphic Tee",
    slug: "wox-new-wave-graphic-tee",
    basePrice: 999,
    salePrice: null,
    images: [{ url: "/images/products/men/t-shirts/wox-classic-white-basic-tee-1.png", alt: "New Wave Graphic Tee" }],
    averageRating: 4.6,
    reviewCount: 8,
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "4",
    name: "WOX Urban Tech Joggers",
    slug: "wox-urban-tech-joggers",
    basePrice: 1599,
    salePrice: 1299,
    images: [{ url: "/images/products/men/pants/wox-comfort-jogger-pants-1.png", alt: "Urban Tech Joggers" }],
    averageRating: 4.8,
    reviewCount: 15,
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "5",
    name: "WOX Boys Explorer Adventure Tee",
    slug: "wox-boys-explorer-adventure-tee",
    basePrice: 799,
    salePrice: null,
    images: [{ url: "/images/products/boys/t-shirts/wox-boys-graphic-print-tee-1.png", alt: "Boys Explorer Adventure Tee" }],
    averageRating: 4.4,
    reviewCount: 6,
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "6",
    name: "WOX Boys Summer Vacation Shirt",
    slug: "wox-boys-summer-vacation-shirt",
    basePrice: 1199,
    salePrice: 999,
    images: [{ url: "/images/products/boys/shirts/wox-boys-striped-casual-shirt-1.png", alt: "Boys Summer Vacation Shirt" }],
    averageRating: 4.3,
    reviewCount: 9,
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "7",
    name: "WOX Boys Athletic Shorts",
    slug: "wox-boys-athletic-shorts",
    basePrice: 899,
    salePrice: null,
    images: [{ url: "/images/products/boys/pants/wox-boys-cargo-shorts-1.png", alt: "Boys Athletic Shorts" }],
    averageRating: 4.5,
    reviewCount: 11,
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "8",
    name: "WOX Boys Denim Comfort Jeans",
    slug: "wox-boys-denim-comfort-jeans",
    basePrice: 1499,
    salePrice: null,
    images: [{ url: "/images/products/boys/pants/wox-boys-classic-denim-jeans-1.png", alt: "Boys Denim Comfort Jeans" }],
    averageRating: 4.6,
    reviewCount: 7,
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "9",
    name: "WOX Classic Stripe Poplin Shirt",
    slug: "wox-classic-stripe-poplin-shirt",
    basePrice: 1799,
    salePrice: 1399,
    images: [{ url: "/images/products/men/shirts/wox-slim-fit-blue-dress-shirt-1.png", alt: "Classic Stripe Poplin Shirt" }],
    averageRating: 4.4,
    reviewCount: 14,
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "10",
    name: "WOX Boys Color Block Polo",
    slug: "wox-boys-color-block-polo",
    basePrice: 1099,
    salePrice: null,
    images: [{ url: "/images/products/boys/t-shirts/wox-boys-sports-polo-tee-1.png", alt: "Boys Color Block Polo" }],
    averageRating: 4.7,
    reviewCount: 10,
    category: { name: "T-Shirts", gender: "boys" },
  },
];

const categories = ["All", "Shirts", "T-Shirts", "Pants"];
const genders = ["All", "Men", "Boys"];
const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const priceRanges = [
  { label: "Under ₹1,000", min: 0, max: 999 },
  { label: "₹1,000 - ₹1,500", min: 1000, max: 1500 },
  { label: "₹1,500 - ₹2,000", min: 1500, max: 2000 },
  { label: "Over ₹2,000", min: 2000, max: Infinity },
];

const PRODUCTS_PER_PAGE = 8;

export default function NewArrivalsPage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    gender: true,
    price: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const togglePriceRange = (index: number) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category.name === selectedCategory);
    }

    if (selectedGender !== "All") {
      const gender = selectedGender.toLowerCase();
      result = result.filter((p) => p.category.gender === gender);
    }

    if (selectedPriceRanges.length > 0) {
      result = result.filter((p) => {
        const price = p.salePrice ?? p.basePrice;
        return selectedPriceRanges.some((rangeIndex) => {
          const range = priceRanges[rangeIndex];
          return price >= range.min && price <= range.max;
        });
      });
    }

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => {
          const aIsSale = a.salePrice !== null ? 1 : 0;
          const bIsSale = b.salePrice !== null ? 1 : 0;
          return bIsSale - aIsSale;
        });
        break;
      case "price-low":
        result.sort((a, b) => (a.salePrice ?? a.basePrice) - (b.salePrice ?? b.basePrice));
        break;
      case "price-high":
        result.sort((a, b) => (b.salePrice ?? b.basePrice) - (a.salePrice ?? a.basePrice));
        break;
      default:
        break;
    }

    return result;
  }, [selectedCategory, selectedGender, selectedPriceRanges, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSelectedGender("All");
    setSelectedPriceRanges([]);
    setSortBy("relevance");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedGender !== "All" ||
    selectedPriceRanges.length > 0;

  const filterContent = (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          className="flex w-full items-center justify-between py-2 text-sm font-semibold uppercase tracking-wider text-zinc-900"
          onClick={() => toggleSection("category")}
        >
          Category
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.category && "rotate-180"
            )}
          />
        </button>
        {expandedSections.category && (
          <div className="mt-3 space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  selectedCategory === category
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
                onClick={() => {
                  setSelectedCategory(category);
                  setCurrentPage(1);
                }}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200" />

      <div>
        <button
          type="button"
          className="flex w-full items-center justify-between py-2 text-sm font-semibold uppercase tracking-wider text-zinc-900"
          onClick={() => toggleSection("gender")}
        >
          Gender
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.gender && "rotate-180"
            )}
          />
        </button>
        {expandedSections.gender && (
          <div className="mt-3 space-y-2">
            {genders.map((gender) => (
              <button
                key={gender}
                type="button"
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  selectedGender === gender
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
                onClick={() => {
                  setSelectedGender(gender);
                  setCurrentPage(1);
                }}
              >
                {gender}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200" />

      <div>
        <button
          type="button"
          className="flex w-full items-center justify-between py-2 text-sm font-semibold uppercase tracking-wider text-zinc-900"
          onClick={() => toggleSection("price")}
        >
          Price Range
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.price && "rotate-180"
            )}
          />
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

      {hasActiveFilters && (
        <>
          <div className="border-t border-zinc-200" />
          <Button
            variant="outline"
            className="w-full"
            onClick={clearAllFilters}
          >
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            NEW ARRIVALS
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            The latest additions to our collection — {filteredProducts.length} products
          </p>
        </div>

        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-xs text-white">
                {(selectedGender !== "All" ? 1 : 0) + selectedPriceRanges.length}
              </span>
            )}
          </Button>

          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="lg:hidden">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-8">
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            {filterContent}
          </aside>

          <div className="flex-1">
            {paginatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Search className="h-12 w-12 text-zinc-300" />
                <h3 className="mt-4 text-lg font-medium text-zinc-900">
                  No products found
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Try adjusting your filters to find what you&apos;re looking for.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearAllFilters}
                >
                  Clear Filters
                </Button>
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
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
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center text-zinc-900"
              >
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
