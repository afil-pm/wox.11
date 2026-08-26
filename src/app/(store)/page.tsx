import Link from "next/link";
import { Shield, Truck, RotateCcw, Headphones } from "lucide-react";
import { ProductCard, type Product } from "@/components/product/product-card";
import RecentlyViewed from "@/components/product/recently-viewed";

const newArrivals: Product[] = [
  {
    id: "1",
    name: "WOX Men's Peach Polo Shirt",
    slug: "wox-peach-polo-shirt",
    basePrice: 1299,
    salePrice: 999,
    averageRating: 4.5,
    reviewCount: 128,
    images: [{ url: "/images/products/men/t-shirts/wox-peach-polo-shirt-1.png", alt: "Peach Polo Shirt" }],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "2",
    name: "WOX Men's Green Plaid Flannel Shirt",
    slug: "wox-green-plaid-flannel-shirt",
    basePrice: 2499,
    salePrice: 1999,
    averageRating: 4.8,
    reviewCount: 256,
    images: [{ url: "/images/products/men/shirts/wox-green-plaid-flannel-shirt-1.png", alt: "Green Plaid Flannel Shirt" }],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "3",
    name: "WOX Men's Khaki Cargo Pants",
    slug: "wox-khaki-cargo-pants",
    basePrice: 2199,
    salePrice: 1799,
    averageRating: 4.3,
    reviewCount: 89,
    images: [{ url: "/images/products/men/pants/wox-khaki-cargo-pants-1.png", alt: "Khaki Cargo Pants" }],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "4",
    name: "WOX Men's Wine Polo Shirt",
    slug: "wox-wine-polo-shirt",
    basePrice: 1299,
    salePrice: 999,
    averageRating: 4.6,
    reviewCount: 167,
    images: [{ url: "/images/products/men/t-shirts/wox-wine-polo-shirt-1.png", alt: "Wine Polo Shirt" }],
    category: { name: "T-Shirts", gender: "men" },
  },
];

const bestSellers: Product[] = [
  {
    id: "5",
    name: "WOX Men's Brown Plaid Flannel Shirt",
    slug: "wox-brown-plaid-flannel-shirt",
    basePrice: 2299,
    salePrice: 1899,
    averageRating: 4.7,
    reviewCount: 312,
    images: [{ url: "/images/products/men/shirts/wox-brown-plaid-flannel-shirt-1.png", alt: "Brown Plaid Flannel Shirt" }],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "6",
    name: "WOX Men's Navy Formal Chinos",
    slug: "wox-navy-formal-chinos",
    basePrice: 1999,
    salePrice: 1599,
    averageRating: 4.4,
    reviewCount: 201,
    images: [{ url: "/images/products/men/pants/wox-navy-formal-chinos-1.png", alt: "Navy Formal Chinos" }],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "7",
    name: "WOX Men's Lavender Polo Shirt",
    slug: "wox-lavender-polo-shirt",
    basePrice: 1299,
    salePrice: 999,
    averageRating: 4.2,
    reviewCount: 95,
    images: [{ url: "/images/products/men/t-shirts/wox-lavender-polo-shirt-1.png", alt: "Lavender Polo Shirt" }],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "8",
    name: "WOX Men's Rust Plaid Flannel Shirt",
    slug: "wox-rust-plaid-flannel-shirt",
    basePrice: 2199,
    salePrice: 1799,
    averageRating: 4.9,
    reviewCount: 178,
    images: [{ url: "/images/products/men/shirts/wox-rust-plaid-flannel-shirt-1.png", alt: "Rust Plaid Flannel Shirt" }],
    category: { name: "Shirts", gender: "men" },
  },
];

const categories = [
  { name: "Men's Shirts", href: "/men/shirts", gender: "Men", image: "/images/products/men/shirts/wox-green-plaid-flannel-shirt-1.png" },
  { name: "Men's T-Shirts", href: "/men/t-shirts", gender: "Men", image: "/images/products/men/t-shirts/wox-peach-polo-shirt-1.png" },
  { name: "Men's Pants", href: "/men/pants", gender: "Men", image: "/images/products/men/pants/wox-khaki-cargo-pants-1.png" },
  { name: "Boys' Shirts", href: "/boys/shirts", gender: "Boys", image: "/images/products/boys/shirts/wox-boys-denim-shirt-1.png" },
  { name: "Boys' T-Shirts", href: "/boys/t-shirts", gender: "Boys", image: "/images/products/boys/t-shirts/wox-boys-grey-sweatshirt-1.png" },
  { name: "Boys' Pants", href: "/boys/pants", gender: "Boys", image: "/images/products/boys/pants/wox-boys-black-wide-leg-jeans-1.png" },
];

const trustItems = [
  { icon: Shield, title: "Secure Payments", description: "100% secure payment methods" },
  { icon: Truck, title: "Fast Delivery", description: "Free shipping on orders above ₹999" },
  { icon: RotateCcw, title: "Easy Returns", description: "7-day hassle-free returns" },
  { icon: Headphones, title: "Customer Support", description: "24/7 dedicated support" },
];

export default function Home() {
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
          <p className="mt-4 text-lg font-light text-zinc-200 sm:text-xl">
            Modern essentials for men and boys.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/men"
              className="inline-flex h-12 items-center justify-center rounded-none bg-white px-8 text-sm font-semibold uppercase tracking-wider text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              Shop Men
            </Link>
            <Link
              href="/boys"
              className="inline-flex h-12 items-center justify-center rounded-none border border-white px-8 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-zinc-900"
            >
              Shop Boys
            </Link>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold uppercase tracking-wider text-zinc-900 sm:text-3xl">
            Shop by Category
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="group relative flex aspect-square items-end overflow-hidden bg-zinc-100 p-4 transition-all hover:shadow-lg sm:p-6"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="relative text-sm font-semibold uppercase tracking-wider text-white sm:text-base">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
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
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
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
