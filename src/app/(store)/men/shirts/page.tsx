"use client";

import ProductListingPage from "@/components/product/product-listing-page";

export default function MenShirtsPage() {
  return (
    <ProductListingPage
      gender="men"
      category="shirts"
      title="MEN'S SHIRTS"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Men", href: "/men" },
        { label: "Shirts" },
      ]}
      sizes={["S", "M", "L", "XL", "XXL"]}
      priceRanges={[
        { label: "Under ₹1,000", min: 0, max: 999 },
        { label: "₹1,000 - ₹1,500", min: 1000, max: 1500 },
        { label: "₹1,500 - ₹2,000", min: 1500, max: 2000 },
        { label: "Over ₹2,000", min: 2000, max: Infinity },
      ]}
    />
  );
}
