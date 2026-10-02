import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import SeoSetting from "@/lib/models/seo-setting";

const DATA_URL_PATTERN = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/;
const FALLBACK = "/opengraph-image.png";

/**
 * Serves the admin-uploaded default OG image. The app stores uploads inline
 * (there is no file store), so crawlers need a real http URL — this endpoint
 * turns the stored `data:image/...` payload into one. The layout references it
 * as `/api/og-image?v=<timestamp>`, and the version changes whenever the image
 * does, so caches never serve a stale picture. Without an upload the request
 * redirects to the built-in image.
 */
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const doc = await SeoSetting.findOne({ key: "site" })
      .select("ogImageData ogImageVersion")
      .lean() as { ogImageData?: string; ogImageVersion?: number } | null;

    const dataUrl = doc?.ogImageData;
    if (!dataUrl) {
      return NextResponse.redirect(new URL(FALLBACK, request.url), 302);
    }

    const match = DATA_URL_PATTERN.exec(dataUrl);
    if (!match) {
      return NextResponse.redirect(new URL(FALLBACK, request.url), 302);
    }

    const bytes = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
    const etag = `"og-${doc?.ogImageVersion || 0}"`;

    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": match[1],
        "Cache-Control": "public, max-age=3600, must-revalidate",
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/og-image error:", error);
    return NextResponse.redirect(new URL(FALLBACK, request.url), 302);
  }
}
