"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Truck, RotateCcw, Headphones } from "lucide-react";
import { ProductCard, type Product } from "@/components/product/product-card";
import RecentlyViewed from "@/components/product/recently-viewed";
import CategorySection from "@/components/category/CategorySection";
import WoxLoader from "@/components/ui/wox-loader";

const trustItems = [
  { icon: Shield, title: "Secure Payments", description: "100% secure payment methods" },
  { icon: Truck, title: "Fast Delivery", description: "Free shipping on orders above ₹999" },
  { icon: RotateCcw, title: "Easy Returns", description: "7-day hassle-free returns" },
  { icon: Headphones, title: "Customer Support", description: "24/7 dedicated support" },
];

export default function Home() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [newRes, bestRes] = await Promise.all([
          fetch("/api/products/all?sort=newest&limit=10"),
          fetch("/api/products/all?sort=popular&limit=4"),
        ]);
        const newData = await newRes.json();
        const bestData = await bestRes.json();
        setNewArrivals(newData.products || []);
        setBestSellers(bestData.products || []);
      } catch {
        console.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-20 text-center">
        <img
          src="/images/hero.jpg"
          alt="Men's Fashion"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Define Your Everyday.
          </h1>
          <p className="mt-4 text-lg font-light text-zinc-300 sm:text-xl">
            Modern essentials for men and boys.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/men"
              className="group inline-flex h-13 w-48 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold uppercase tracking-wider text-zinc-900 whitespace-nowrap transition-all hover:scale-105 hover:shadow-lg"
            >
              Shop Men
              <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </Link>
            <Link
              href="/boys"
              className="group inline-flex h-13 w-48 items-center justify-center gap-2 rounded-full border-2 border-white px-8 text-sm font-semibold uppercase tracking-wider text-white whitespace-nowrap transition-all hover:scale-105 hover:bg-white hover:text-zinc-900 hover:shadow-lg"
            >
              Shop Boys
              <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <CategorySection />

      {/* New Arrivals Section */}
      <section className="bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold uppercase tracking-wider text-zinc-900 sm:text-3xl">
              New Arrivals
            </h2>
            <Link
              href="/new-arrivals"
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline hover:text-zinc-900"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <WoxLoader />
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="bg-zinc-950 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl md:text-5xl">
            Built for Everyday.
          </h2>
          <p className="mt-4 text-lg font-light text-zinc-400">
            Shop the latest collection.
          </p>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold uppercase tracking-wider text-zinc-900 sm:text-3xl">
              Best Sellers
            </h2>
            <Link
              href="/best-sellers"
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline hover:text-zinc-900"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <WoxLoader />
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Trust Section */}
      <section className="border-t border-zinc-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center">
                <item.icon className="h-8 w-8 text-zinc-900" strokeWidth={1.5} />
                <h3 className="mt-4 text-sm font-semibold uppercase tracking-wider text-zinc-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
