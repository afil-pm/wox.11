import { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Best Sellers | Top Selling Fashion at WOX.11",
  description: "Shop our best-selling men's and boys fashion at WOX.11. Discover popular shirts, t-shirts, and pants loved by our customers.",
  keywords: ["best sellers", "top selling", "popular fashion", "men clothing", "boys clothing", "wox11"],
  alternates: { canonical: `${SITE_URL}/best-sellers` },
  openGraph: {
    title: "Best Sellers | Top Selling Fashion at WOX.11",
    description: "Shop our best-selling men's and boys fashion at WOX.11.",
    url: `${SITE_URL}/best-sellers`,
    siteName: "WOX.11",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function BestSellersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
