"use client";

import ProductListingPage from "@/components/product/product-listing-page";

export default function BoysPantsPage() {
  return (
    <ProductListingPage
      gender="boys"
      category="pants"
      title="BOYS' PANTS"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Boys", href: "/boys" },
        { label: "Pants" },
      ]}
      sizes={["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y", "14-15Y"]}
      priceRanges={[
        { label: "Under ₹800", min: 0, max: 799 },
        { label: "₹800 - ₹1,100", min: 800, max: 1100 },
        { label: "₹1,100 - ₹1,500", min: 1100, max: 1500 },
        { label: "Over ₹1,500", min: 1500, max: Infinity },
      ]}
    />
  );
}
