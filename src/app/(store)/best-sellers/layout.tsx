import { Metadata, ResolvingMetadata } from "next";
import { SITE_URL } from "@/lib/seo";
import { parentOgImage } from "@/lib/seo-settings";

const base: Metadata = {
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

// The openGraph/twitter blocks above replace the root layout's wholesale, so
// the resolved og:image is carried over explicitly — otherwise the page would
// ship no og:image at all (and never follow the admin-configured default).
export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const og = parentOgImage(await parent);
  return {
    ...base,
    openGraph: og
      ? { ...base.openGraph!, images: [og] }
      : base.openGraph,
    twitter: og
      ? { ...base.twitter!, images: [og.url] }
      : base.twitter,
  };
}

export default function BestSellersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
