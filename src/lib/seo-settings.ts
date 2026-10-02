/**
 * SEO settings shared by the admin panel (client), the root layout's
 * `generateMetadata`, and the admin/public API routes. Everything here is
 * framework- and database-free so it is safe to import anywhere.
 */

export interface SeoSettingsData {
  siteTitle: string;
  siteDescription: string;
  /** Public URL/path for og:image. "" means the built-in default image. */
  defaultOgImage: string;
  /** Probed image dimensions; 0 means unknown (og:image:width is then omitted). */
  ogImageWidth: number;
  ogImageHeight: number;
  ogImageAlt: string;
  keywords: string[];
  homepageTitle: string;
  homepageDescription: string;
}

export const DEFAULT_SEO_SETTINGS: SeoSettingsData = {
  siteTitle: "WOX.11 | Modern Essentials for Men & Boys",
  siteDescription:
    "Premium men's and boys fashion store. Modern essentials for everyday wear. Shop shirts, t-shirts, and pants with free shipping in Kerala.",
  defaultOgImage: "",
  ogImageWidth: 0,
  ogImageHeight: 0,
  ogImageAlt: "",
  keywords: ["men fashion", "boys fashion", "clothing", "shirts", "t-shirts", "pants", "online shopping"],
  homepageTitle: "WOX.11 — Modern Essentials for Men & Boys",
  homepageDescription:
    "Discover premium fashion for men and boys at WOX.11. Shop our curated collection of shirts, t-shirts, and pants.",
};

/**
 * Uploaded OG images are stored inline (`data:image/...` — the app has no file
 * store), so uploads share the hero-banner cap. The admin panel compresses
 * files before saving, which keeps them comfortably under this.
 */
export const MAX_OG_DATA_URL_LENGTH = 700_000;

/** The file extensions an og:image link may end with (query strings ignored). */
const ALLOWED_LINK_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "ico"];

export type OgImageValidation =
  | { ok: true; kind: "default"; url: "" }
  | { ok: true; kind: "upload"; url: string }
  | { ok: true; kind: "link"; url: string }
  | { ok: false; error: string };

/**
 * Validates the admin-entered OG image value. Accepts three forms:
 * - empty (the built-in site default),
 * - an inline upload (`data:image/...`, capped like hero uploads),
 * - an app path (`/images/...`) or a full http(s) URL whose extension, when
 *   present, must point at a real image format.
 */
export function validateOgImageUrl(raw?: string | null): OgImageValidation {
  const url = (raw ?? "").trim();

  if (!url) return { ok: true, kind: "default", url: "" };

  if (url.startsWith("data:")) {
    if (!/^data:image\/(jpeg|jpg|png|webp|gif|avif|bmp);base64,/i.test(url)) {
      return { ok: false, error: "Data URL must be an image (data:image/jpeg|png|webp/…;base64,…)" };
    }
    if (url.length > MAX_OG_DATA_URL_LENGTH) {
      const kb = Math.round(url.length / 1000);
      return {
        ok: false,
        error: `Uploaded image is ${kb}KB, over the ${Math.round(
          MAX_OG_DATA_URL_LENGTH / 1000
        )}KB limit. Use "Upload image" in the admin panel — it compresses automatically.`,
      };
    }
    return { ok: true, kind: "upload", url };
  }

  if (url.startsWith("/") && !url.startsWith("//")) {
    return { ok: true, kind: "link", url };
  }

  if (/^[a-z]:[\\/]/i.test(url)) {
    return {
      ok: false,
      error: "Local file paths aren't valid image URLs — upload the file instead.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      ok: false,
      error: "Enter a full image URL (https://example.com/image.jpg), an app path like /images/og.jpg, or upload a file.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http:// and https:// image URLs are supported" };
  }

  const ext = parsed.pathname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (ext && !ALLOWED_LINK_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      error: `That URL ends in .${ext} — og:image must link to a JPG, JPEG, PNG or WebP (or GIF/BMP/ICO) image.`,
    };
  }

  return { ok: true, kind: "link", url: parsed.toString() };
}

/** The image the site ships with, used until an admin configures a replacement. */
export const BUILT_IN_OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1024,
  height: 1024,
  alt: "WOX.11 - Modern Essentials for Men & Boys",
  type: "image/png",
};

export interface ResolvedOgImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
}

/**
 * Turns the stored settings into the og:image/twitter:image triple the layout
 * emits. Falls back to the built-in image (with its original dimensions and
 * alt text) whenever nothing valid is configured — including a database
 * outage — so head metadata never regresses.
 */
export function resolveOgImageMeta(settings?: SeoSettingsData | null): ResolvedOgImage {
  const custom = settings?.defaultOgImage?.trim();
  if (!custom || custom.startsWith("data:")) return { ...BUILT_IN_OG_IMAGE };

  return {
    url: custom,
    width: settings && settings.ogImageWidth > 0 ? settings.ogImageWidth : undefined,
    height: settings && settings.ogImageHeight > 0 ? settings.ogImageHeight : undefined,
    alt: settings?.ogImageAlt?.trim() || settings?.siteTitle?.trim() || BUILT_IN_OG_IMAGE.alt,
  };
}

/**
 * The og:image a parent segment already resolved (root layout first, then
 * gender/category layouts). Child segments pass it down so every page's
 * fallback image follows the admin-configured default instead of the static
 * asset. Returns null when the parent has no image.
 */
export function parentOgImage(parent: unknown): ResolvedOgImage | null {
  const og = (parent as { openGraph?: { images?: unknown } } | null | undefined)?.openGraph;
  const raw = og?.images;
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first) return null;

  if (typeof first === "string") {
    return first ? { url: first } : null;
  }

  const obj = first as { url?: unknown; width?: unknown; height?: unknown; alt?: unknown; type?: unknown };
  if (typeof obj.url !== "string" || !obj.url) return null;
  return {
    url: obj.url,
    width: typeof obj.width === "number" ? obj.width : undefined,
    height: typeof obj.height === "number" ? obj.height : undefined,
    alt: typeof obj.alt === "string" ? obj.alt : undefined,
    type: typeof obj.type === "string" ? obj.type : undefined,
  };
}
