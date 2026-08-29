import { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "New Arrivals | Latest Fashion at WOX.11",
  description: "Discover the latest men's and boys fashion at WOX.11. Shop new arrivals including shirts, t-shirts, and pants with premium quality and affordable prices.",
  keywords: ["new arrivals", "latest fashion", "men clothing", "boys clothing", "wox11"],
  alternates: { canonical: `${SITE_URL}/new-arrivals` },
  openGraph: {
    title: "New Arrivals | Latest Fashion at WOX.11",
    description: "Discover the latest men's and boys fashion at WOX.11.",
    url: `${SITE_URL}/new-arrivals`,
    siteName: "WOX.11",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
