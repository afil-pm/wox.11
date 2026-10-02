import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import SeoSetting from "@/lib/models/seo-setting";
import { isAdmin } from "@/lib/auth/guards";
import { DEFAULT_SEO_SETTINGS, validateOgImageUrl, type SeoSettingsData } from "@/lib/seo-settings";

type ExistingDoc = {
  defaultOgImage?: string;
  ogImageData?: string;
  ogImageVersion?: number;
} | null;

function clamp(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_SEO_SETTINGS.keywords;
  return value
    .map((kw) => String(kw ?? "").trim().slice(0, 100))
    .filter(Boolean)
    .slice(0, 100);
}

function publicSettings(doc: Record<string, unknown>): SeoSettingsData {
  return {
    ...DEFAULT_SEO_SETTINGS,
    siteTitle: String(doc.siteTitle ?? DEFAULT_SEO_SETTINGS.siteTitle),
    siteDescription: String(doc.siteDescription ?? DEFAULT_SEO_SETTINGS.siteDescription),
    defaultOgImage: String(doc.defaultOgImage ?? ""),
    ogImageWidth: Number(doc.ogImageWidth ?? 0) || 0,
    ogImageHeight: Number(doc.ogImageHeight ?? 0) || 0,
    ogImageAlt: String(doc.ogImageAlt ?? ""),
    keywords: normalizeKeywords(doc.keywords),
    homepageTitle: String(doc.homepageTitle ?? DEFAULT_SEO_SETTINGS.homepageTitle),
    homepageDescription: String(doc.homepageDescription ?? DEFAULT_SEO_SETTINGS.homepageDescription),
  };
}

/**
 * Fetches the saved og:image link from the server before it is stored so a
 * dead or non-image URL is rejected even when the request does not come from
 * the admin page (which already previews the image in the browser first).
 */
async function verifyOgImageUrl(url: string, origin: string): Promise<string | null> {
  let target: URL;
  try {
    target = url.startsWith("/") ? new URL(url, origin) : new URL(url);
  } catch {
    return "Image URL could not be checked.";
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return "Only http:// and https:// image URLs are supported";
  }

  try {
    const options = {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "WOX.11-SEO-Check" },
    } as const;
    let res = await fetch(target, { ...options, method: "HEAD" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(target, { ...options, method: "GET" });
      try {
        await res.body?.cancel();
      } catch {}
    }
    if (!res.ok) {
      return `Image URL returned HTTP ${res.status} — it must be publicly accessible.`;
    }
    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (contentType && contentType !== "application/octet-stream" && !contentType.startsWith("image/")) {
      return "That URL did not return an image — og:image must link directly to an image file.";
    }
    return null;
  } catch {
    return "Image URL could not be reached — check that it is publicly accessible and try again.";
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const doc = await SeoSetting.findOne({ key: "site" }).lean();
    if (!doc) {
      return NextResponse.json({ exists: false, settings: DEFAULT_SEO_SETTINGS });
    }
    return NextResponse.json({ exists: true, settings: publicSettings(doc as unknown as Record<string, unknown>) });
  } catch (error) {
    console.error("GET /api/wox/admin/seo error:", error);
    return NextResponse.json({ error: "Failed to load SEO settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const body = await request.json();

    const existing = (await SeoSetting.findOne({ key: "site" }).lean()) as ExistingDoc;

    const incomingOgImage = String(body.ogImage ?? "").trim();
    let defaultOgImage = existing?.defaultOgImage || "";
    let ogImageData = existing?.ogImageData || "";
    let ogImageVersion = existing?.ogImageVersion || 0;

    if (incomingOgImage !== defaultOgImage) {
      const check = validateOgImageUrl(incomingOgImage);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
      if (check.kind === "link") {
        const verifyError = await verifyOgImageUrl(check.url, request.nextUrl.origin);
        if (verifyError) {
          return NextResponse.json({ error: verifyError }, { status: 400 });
        }
      }
      ogImageVersion = Date.now();
      if (check.kind === "upload") {
        ogImageData = check.url;
        defaultOgImage = `/api/og-image?v=${ogImageVersion}`;
      } else {
        ogImageData = "";
        defaultOgImage = check.url;
      }
    }

    const value = {
      key: "site",
      siteTitle: clamp(body.siteTitle, 300) || DEFAULT_SEO_SETTINGS.siteTitle,
      siteDescription: clamp(body.siteDescription, 1000),
      defaultOgImage,
      ogImageData,
      ogImageVersion,
      ogImageWidth: Math.max(0, Number(body.ogImageWidth) || 0),
      ogImageHeight: Math.max(0, Number(body.ogImageHeight) || 0),
      ogImageAlt: clamp(body.ogImageAlt, 300),
      keywords: normalizeKeywords(body.keywords),
      homepageTitle: clamp(body.homepageTitle, 300),
      homepageDescription: clamp(body.homepageDescription, 1000),
    };

    const saved = await SeoSetting.findOneAndUpdate(
      { key: "site" },
      { $set: value },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      exists: true,
      settings: publicSettings(saved as unknown as Record<string, unknown>),
    });
  } catch (error) {
    console.error("PUT /api/wox/admin/seo error:", error);
    return NextResponse.json({ error: "Failed to save SEO settings" }, { status: 500 });
  }
}
