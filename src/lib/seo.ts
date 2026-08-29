import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://wox11.vercel.app";
const SITE_NAME = "WOX.11";
const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image.png`;

export interface ProductSeoData {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  salePrice: number;
  sku: string;
  images: { url: string; alt: string }[];
  averageRating: number;
  reviewCount: number;
  categoryName: string;
  categorySlug: string;
  gender: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    noindex?: boolean;
  };
}

export function generateProductSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateProductMetaTitle(product: ProductSeoData): string {
  if (product.seo?.metaTitle) return product.seo.metaTitle;
  return `${product.name} | Buy Online at ${SITE_NAME}`;
}

export function generateProductMetaDescription(product: ProductSeoData): string {
  if (product.seo?.metaDescription) return product.seo.metaDescription;
  const price = product.salePrice > 0 ? product.salePrice : product.basePrice;
  const desc = product.description
    ? product.description.replace(/<[^>]*>/g, "").slice(0, 120)
    : `Shop ${product.name} at ${SITE_NAME}. Premium quality fashion for men and boys.`;
  return `${desc} Starting at ₹${price}. Free shipping on orders from Kerala.`;
}

export function generateProductKeywords(product: ProductSeoData): string[] {
  if (product.seo?.keywords?.length) return product.seo.keywords;
  const keywords = [
    product.name.toLowerCase(),
    product.categoryName.toLowerCase(),
    product.gender,
    "wox11",
    "fashion",
    "online shopping",
    "buy online",
  ];
  if (product.images[0]?.alt) keywords.push(product.images[0].alt.toLowerCase());
  return [...new Set(keywords)];
}

export function generateProductUrl(product: { gender: string; categorySlug: string; slug: string }): string {
  return `${SITE_URL}/${product.gender}/${product.categorySlug}/${product.slug}`;
}

export function generateProductMetadata(product: ProductSeoData): Metadata {
  const title = generateProductMetaTitle(product);
  const description = generateProductMetaDescription(product);
  const keywords = generateProductKeywords(product);
  const url = generateProductUrl({
    gender: product.gender,
    categorySlug: product.categorySlug,
    slug: product.slug,
  });
  const ogImage = product.seo?.ogImage || product.images[0]?.url || DEFAULT_OG_IMAGE;
  const ogTitle = product.seo?.ogTitle || title;
  const ogDescription = product.seo?.ogDescription || description;

  return {
    title,
    description,
    keywords,
    robots: product.seo?.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    alternates: {
      canonical: product.seo?.canonicalUrl || url,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

export interface CategorySeoData {
  name: string;
  slug: string;
  gender: string;
  type: string;
  description?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };
}

export function generateCategoryMetadata(category: CategorySeoData): Metadata {
  const title = category.seo?.metaTitle || `${category.gender === "men" ? "Men's" : "Boys'"} ${category.name} | ${SITE_NAME}`;
  const description =
    category.seo?.metaDescription ||
    `Shop ${category.gender === "men" ? "men's" : "boys'"} ${category.name.toLowerCase()} at ${SITE_NAME}. Premium quality fashion with free shipping in Kerala.`;
  const keywords = category.seo?.keywords?.length
    ? category.seo.keywords
    : [`${category.gender} ${category.name}`, "fashion", "online shopping", "wox11"];
  const url = `${SITE_URL}/${category.gender}/${category.slug}`;
  const ogImage = category.seo?.ogImage || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function generateGenderMetadata(gender: "men" | "boys"): Metadata {
  const label = gender === "men" ? "Men's" : "Boys'";
  return {
    title: `${label} Fashion Collection | ${SITE_NAME}`,
    description: `Explore our curated collection of ${label.toLowerCase()} fashion at ${SITE_NAME}. Shirts, t-shirts, pants and more. Premium quality at affordable prices.`,
    keywords: [`${label.toLowerCase()} fashion`, "clothing", "shirts", "t-shirts", "pants", "wox11"],
    alternates: { canonical: `${SITE_URL}/${gender}` },
    openGraph: {
      title: `${label} Fashion Collection | ${SITE_NAME}`,
      description: `Explore our curated collection of ${label.toLowerCase()} fashion at ${SITE_NAME}.`,
      url: `${SITE_URL}/${gender}`,
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${label} Fashion` }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} Fashion Collection | ${SITE_NAME}`,
      description: `Explore our curated collection of ${label.toLowerCase()} fashion at ${SITE_NAME}.`,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export interface ProductSchemaOrg {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  image: string[];
  url: string;
  sku: string;
  brand: { "@type": "Brand"; name: string };
  offers: {
    "@type": "Offer";
    url: string;
    priceCurrency: string;
    price: number;
    availability: string;
    itemCondition: string;
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
  };
}

export function generateProductSchema(product: ProductSeoData): ProductSchemaOrg {
  const price = product.salePrice > 0 ? product.salePrice : product.basePrice;
  const url = generateProductUrl({
    gender: product.gender,
    categorySlug: product.categorySlug,
    slug: product.slug,
  });
  const images = product.images.map((img) => img.url).filter(Boolean);

  const schema: ProductSchemaOrg = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} at ${SITE_NAME}`,
    image: images.length > 0 ? images : [DEFAULT_OG_IMAGE],
    url,
    sku: product.sku,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (product.averageRating > 0 && product.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
    };
  }

  return schema;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/opengraph-image.png`,
    description: "Premium men's and boys fashion store. Modern essentials for everyday wear.",
    sameAs: [],
  };
}

export interface WebsiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  potentialAction: {
    "@type": "SearchAction";
    target: string;
    "query-input": string;
  };
}

export function generateWebsiteSchema(): WebsiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE };
