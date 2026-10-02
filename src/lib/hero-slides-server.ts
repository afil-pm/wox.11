import { connectMongoDB } from "@/lib/mongodb";
import HeroSlide from "@/lib/models/hero-slide";
import { DEFAULT_HERO_SLIDES, type HeroSlideData } from "@/lib/hero-slides";

/**
 * Active hero banners in display order, shared by the homepage (server
 * rendered, so the very first paint already shows admin-managed slides) and
 * the public `/api/hero-slides` endpoint. Falls back to the built-in hero when
 * nothing is configured or the database is unreachable — never throws.
 */
export async function getActiveHeroSlides(): Promise<HeroSlideData[]> {
  try {
    await connectMongoDB();
    const slides = await HeroSlide.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const mapped: HeroSlideData[] = slides
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

    return mapped.length > 0 ? mapped : DEFAULT_HERO_SLIDES;
  } catch (error) {
    console.error("getActiveHeroSlides error:", error);
    return DEFAULT_HERO_SLIDES;
  }
}
