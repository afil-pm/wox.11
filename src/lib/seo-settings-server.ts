import { connectMongoDB } from "@/lib/mongodb";
import SeoSetting from "@/lib/models/seo-setting";
import { DEFAULT_SEO_SETTINGS, type SeoSettingsData } from "@/lib/seo-settings";

type SeoSettingLean = {
  siteTitle?: string;
  siteDescription?: string;
  defaultOgImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageAlt?: string;
  keywords?: string[];
  homepageTitle?: string;
  homepageDescription?: string;
};

function pick(doc: SeoSettingLean | null | undefined): SeoSettingsData {
  return {
    ...DEFAULT_SEO_SETTINGS,
    ...(doc
      ? {
          siteTitle: doc.siteTitle ?? DEFAULT_SEO_SETTINGS.siteTitle,
          siteDescription: doc.siteDescription ?? DEFAULT_SEO_SETTINGS.siteDescription,
          defaultOgImage: doc.defaultOgImage ?? "",
          ogImageWidth: doc.ogImageWidth ?? 0,
          ogImageHeight: doc.ogImageHeight ?? 0,
          ogImageAlt: doc.ogImageAlt ?? "",
          keywords: Array.isArray(doc.keywords) ? doc.keywords : DEFAULT_SEO_SETTINGS.keywords,
          homepageTitle: doc.homepageTitle ?? DEFAULT_SEO_SETTINGS.homepageTitle,
          homepageDescription: doc.homepageDescription ?? DEFAULT_SEO_SETTINGS.homepageDescription,
        }
      : {}),
  };
}

/**
 * Saved SEO settings for the root layout's `generateMetadata`. Never throws:
 * a fresh install or a database outage falls back to the built-in defaults so
 * head metadata always renders. The image payload itself is excluded — the
 * layout only needs the public `/api/og-image` reference.
 */
export async function getSeoSettings(): Promise<SeoSettingsData | null> {
  try {
    await connectMongoDB();
    const doc = await SeoSetting.findOne({ key: "site" })
      .select(
        "siteTitle siteDescription defaultOgImage ogImageWidth ogImageHeight ogImageAlt keywords homepageTitle homepageDescription"
      )
      .lean() as SeoSettingLean | null;
    return doc ? pick(doc) : null;
  } catch (error) {
    console.error("getSeoSettings error:", error);
    return null;
  }
}

export { pick as pickSeoSettings };
