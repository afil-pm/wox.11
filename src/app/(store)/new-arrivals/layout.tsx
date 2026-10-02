import { Metadata, ResolvingMetadata } from "next";
import { SITE_URL } from "@/lib/seo";
import { parentOgImage } from "@/lib/seo-settings";

const base: Metadata = {
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

// Same as best-sellers: keep the page-specific fields but carry the resolved
// og:image over so the page always ships one that follows the admin default.
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

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
