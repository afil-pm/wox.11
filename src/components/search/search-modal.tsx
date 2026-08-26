"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

import { Search, X, Clock, TrendingUp } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

const products = [
  {
    id: "1",
    name: "WOX Men's Peach Polo Shirt",
    slug: "wox-peach-polo-shirt",
    price: 999,
    image: "/images/products/men/t-shirts/wox-peach-polo-shirt-1.png",
    category: "Men's T-Shirts",
    gender: "men",
    categorySlug: "t-shirts",
  },
  {
    id: "2",
    name: "WOX Men's Green Plaid Flannel Shirt",
    slug: "wox-green-plaid-flannel-shirt",
    price: 1999,
    image: "/images/products/men/shirts/wox-green-plaid-flannel-shirt-1.png",
    category: "Men's Shirts",
    gender: "men",
    categorySlug: "shirts",
  },
  {
    id: "3",
    name: "WOX Men's Khaki Cargo Pants",
    slug: "wox-khaki-cargo-pants",
    price: 1799,
    image: "/images/products/men/pants/wox-khaki-cargo-pants-1.png",
    category: "Men's Pants",
    gender: "men",
    categorySlug: "pants",
  },
  {
    id: "4",
    name: "WOX Men's Lavender Polo Shirt",
    slug: "wox-lavender-polo-shirt",
    price: 999,
    image: "/images/products/men/t-shirts/wox-lavender-polo-shirt-1.png",
    category: "Men's T-Shirts",
    gender: "men",
    categorySlug: "t-shirts",
  },
  {
    id: "5",
    name: "WOX Men's Wine Polo Shirt",
    slug: "wox-wine-polo-shirt",
    price: 999,
    image: "/images/products/men/t-shirts/wox-wine-polo-shirt-1.png",
    category: "Men's T-Shirts",
    gender: "men",
    categorySlug: "t-shirts",
  },
  {
    id: "6",
    name: "WOX Men's Navy Formal Chinos",
    slug: "wox-navy-formal-chinos",
    price: 1599,
    image: "/images/products/men/pants/wox-navy-formal-chinos-1.png",
    category: "Men's Pants",
    gender: "men",
    categorySlug: "pants",
  },
  {
    id: "7",
    name: "WOX Men's Brown Plaid Flannel Shirt",
    slug: "wox-brown-plaid-flannel-shirt",
    price: 1899,
    image: "/images/products/men/shirts/wox-brown-plaid-flannel-shirt-1.png",
    category: "Men's Shirts",
    gender: "men",
    categorySlug: "shirts",
  },
  {
    id: "8",
    name: "WOX Men's Sage Polo Shirt",
    slug: "wox-sage-polo-shirt",
    price: 999,
    image: "/images/products/men/t-shirts/wox-sage-polo-shirt-1.png",
    category: "Men's T-Shirts",
    gender: "men",
    categorySlug: "t-shirts",
  },
  {
    id: "9",
    name: "WOX Boys' Denim Shirt",
    slug: "wox-boys-denim-shirt",
    price: 1099,
    image: "/images/products/boys/shirts/wox-boys-denim-shirt-1.png",
    category: "Boys' Shirts",
    gender: "boys",
    categorySlug: "shirts",
  },
  {
    id: "10",
    name: "WOX Boys' Grey Textured Sweatshirt",
    slug: "wox-boys-grey-sweatshirt",
    price: 799,
    image: "/images/products/boys/t-shirts/wox-boys-grey-sweatshirt-1.png",
    category: "Boys' T-Shirts",
    gender: "boys",
    categorySlug: "t-shirts",
  },
  {
    id: "11",
    name: "WOX Boys' Black Wide-Leg Jeans",
    slug: "wox-boys-black-wide-leg-jeans",
    price: 1199,
    image: "/images/products/boys/pants/wox-boys-black-wide-leg-jeans-1.png",
    category: "Boys' Pants",
    gender: "boys",
    categorySlug: "pants",
  },
  {
    id: "12",
    name: "WOX Boys' Grey Flame Print Joggers",
    slug: "wox-boys-grey-flame-joggers",
    price: 1099,
    image: "/images/products/boys/pants/wox-boys-grey-flame-joggers-1.png",
    category: "Boys' Pants",
    gender: "boys",
    categorySlug: "pants",
  },
];

const popularSearches = [
  "Oversized T-Shirt",
  "Hoodies",
  "Shirts",
  "Jeans",
  "New Arrivals",
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const saveRecentSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    },
    [recentSearches]
  );

  const removeRecentSearch = useCallback(
    (term: string) => {
      const updated = recentSearches.filter((s) => s !== term);
      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    },
    [recentSearches]
  );

  const results = debouncedQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debouncedQuery.trim()) {
      saveRecentSearch(debouncedQuery);
    }
  };

  const handleResultClick = (term: string) => {
    saveRecentSearch(term);
    onClose();
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300",
        isOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      )}
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={cn(
          "relative mt-16 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 sm:mt-20",
          isOpen
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-95 -translate-y-4 opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        {/* Search Header */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-zinc-400" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products..."
            className="flex-1 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Close search"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </form>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {/* Results */}
          {debouncedQuery.trim() ? (
            results.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/${product.gender || "men"}/${product.categorySlug || "shirts"}/${product.slug}`}
                    onClick={() => handleResultClick(product.name)}
                    className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 transition-all hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                      <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-zinc-500">
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        {product.category}
                      </p>
                      <h3 className="line-clamp-2 text-xs font-medium text-zinc-900 group-hover:text-zinc-600">
                        {product.name}
                      </h3>
                      <span className="mt-auto text-sm font-semibold text-zinc-900">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-4 h-10 w-10 text-zinc-300" strokeWidth={1} />
                <p className="text-sm font-medium text-zinc-900">No results found</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Try a different search term
                </p>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Recent Searches
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        className="group flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 transition-colors hover:border-zinc-300"
                      >
                        <button
                          type="button"
                          onClick={() => handleSuggestionClick(term)}
                          className="text-xs font-medium text-zinc-700"
                        >
                          {term}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecentSearch(term)}
                          className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-200 hover:text-zinc-600"
                          aria-label={`Remove ${term} from recent searches`}
                        >
                          <X className="h-2.5 w-2.5" strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Popular Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSuggestionClick(term)}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-5 py-3 text-center">
          <p className="text-[11px] text-zinc-400">
            Press <kbd className="mx-0.5 rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-600">ESC</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
