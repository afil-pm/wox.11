"use client";

import ProductListingPage from "@/components/product/product-listing-page";

export default function BoysTShirtsPage() {
  return (
    <ProductListingPage
      gender="boys"
      category="t-shirts"
      title="BOYS' T-SHIRTS"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Boys", href: "/boys" },
        { label: "T-Shirts" },
      ]}
      sizes={["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y", "14-15Y"]}
      priceRanges={[
        { label: "Under ₹500", min: 0, max: 499 },
        { label: "₹500 - ₹700", min: 500, max: 700 },
        { label: "₹700 - ₹1,000", min: 700, max: 1000 },
        { label: "Over ₹1,000", min: 1000, max: Infinity },
      ]}
    />
  );
}
