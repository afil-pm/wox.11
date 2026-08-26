"use client";

import ProductListingPage from "@/components/product/product-listing-page";

export default function BoysShirtsPage() {
  return (
    <ProductListingPage
      gender="boys"
      category="shirts"
      title="BOYS' SHIRTS"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Boys", href: "/boys" },
        { label: "Shirts" },
      ]}
      sizes={["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y", "14-15Y"]}
      priceRanges={[
        { label: "Under ₹700", min: 0, max: 699 },
        { label: "₹700 - ₹1,000", min: 700, max: 1000 },
        { label: "₹1,000 - ₹1,500", min: 1000, max: 1500 },
        { label: "Over ₹1,500", min: 1500, max: Infinity },
      ]}
    />
  );
}
