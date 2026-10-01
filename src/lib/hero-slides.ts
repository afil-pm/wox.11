/**
 * The homepage hero before anything is configured in the admin panel. Kept
 * byte-for-byte equivalent to the original static hero so a fresh install —
 * or a database outage — still renders the designed landing section.
 */
export interface HeroSlideData {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  image: string;
  imageAlt: string;
}

export const DEFAULT_HERO_SLIDES: HeroSlideData[] = [
  {
    id: "default-hero",
    title: "Define Your Everyday.",
    subtitle: "Modern essentials for men and boys.",
    ctaLabel: "Shop Men",
    ctaHref: "/men",
    secondaryCtaLabel: "Shop Boys",
    secondaryCtaHref: "/boys",
    image: "/images/hero.jpg",
    imageAlt: "Men's Fashion",
  },
];

/**
 * Only in-app paths (`/men`, `/men/shirts`) and real http(s) links can be
 * stored as a slide destination — `javascript:` and protocol-relative URLs are
 * dropped rather than rendered.
 */
export function safeHeroHref(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return "";
}

