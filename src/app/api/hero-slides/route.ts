import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import HeroSlide from "@/lib/models/hero-slide";
import { DEFAULT_HERO_SLIDES } from "@/lib/hero-slides";

/**
 * Active hero slides for the storefront carousel. Falls back to the built-in
 * hero so the homepage never renders an empty banner.
 */
export async function GET() {
  try {
    await connectMongoDB();
    const slides = await HeroSlide.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const mapped = slides
      .filter((slide) => slide.image && slide.title)
      .map((slide) => ({
        id: String(slide._id),
        title: slide.title,
        subtitle: slide.subtitle || "",
        ctaLabel: slide.ctaLabel || "",
        ctaHref: slide.ctaHref || "",
        secondaryCtaLabel: slide.secondaryCtaLabel || "",
        secondaryCtaHref: slide.secondaryCtaHref || "",
        image: slide.image,
        imageAlt: slide.imageAlt || slide.title,
      }));

    return NextResponse.json(
      { slides: mapped.length > 0 ? mapped : DEFAULT_HERO_SLIDES },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("GET /api/hero-slides error:", error);
    return NextResponse.json({ slides: DEFAULT_HERO_SLIDES });
  }
}
