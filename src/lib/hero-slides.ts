import { validateProductImageUrl, type ImageUrlValidation } from "@/lib/images";

/**
 * Uploaded banners are stored inline as `data:image/...` (the app has no file
 * store), so a hero image may be far longer than a plain link. The admin panel
 * compresses uploads before saving, which keeps them comfortably under this.
 */
export const MAX_HERO_DATA_URL_LENGTH = 700_000;

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

/**
 * Hero image validation: links behave like every other product image, while
 * inline uploads get the larger limit above instead of the shared 2048-char
 * link cap (which rejected every real uploaded banner).
 */
export function validateHeroImageUrl(raw?: string | null): ImageUrlValidation {
  const url = (raw ?? "").trim();

  if (url.startsWith("data:")) {
    if (!/^data:image\//i.test(url)) {
      return { ok: false, error: "Data URL must contain an image (data:image/...)" };
    }
    if (url.length > MAX_HERO_DATA_URL_LENGTH) {
      const kb = Math.round(url.length / 1000);
      return {
        ok: false,
        error: `Uploaded image is ${kb}KB, over the ${Math.round(
          MAX_HERO_DATA_URL_LENGTH / 1000
        )}KB limit. Use "Upload image" in the admin panel — it compresses automatically.`,
      };
    }
    return { ok: true, url };
  }

  return validateProductImageUrl(url);
}

