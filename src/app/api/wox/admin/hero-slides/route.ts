import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import HeroSlide from "@/lib/models/hero-slide";
import { isAdmin } from "@/lib/auth/guards";
import { safeHeroHref, validateHeroImageUrl } from "@/lib/hero-slides";

function normalizeBody(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const image = String(body.image ?? "").trim();
  const imageCheck = validateHeroImageUrl(image);

  return {
    error: !title
      ? "Title is required"
      : !imageCheck.ok
        ? imageCheck.error
        : null,
    value: {
      title,
      subtitle: String(body.subtitle ?? "").trim(),
      ctaLabel: String(body.ctaLabel ?? "").trim(),
      ctaHref: safeHeroHref(body.ctaHref),
      secondaryCtaLabel: String(body.secondaryCtaLabel ?? "").trim(),
      secondaryCtaHref: safeHeroHref(body.secondaryCtaHref),
      image: imageCheck.ok ? imageCheck.url : image,
      imageAlt: String(body.imageAlt ?? "").trim() || title,
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
      active: body.active !== false,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const slides = await HeroSlide.find().sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ slides });
  } catch (error) {
    console.error("GET /api/wox/admin/hero-slides error:", error);
    return NextResponse.json({ slides: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const body = await request.json();
    const { error, value } = normalizeBody(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const slide = await HeroSlide.create(value);
    return NextResponse.json({ slide }, { status: 201 });
  } catch (err) {
    console.error("POST /api/wox/admin/hero-slides error:", err);
    return NextResponse.json({ error: "Failed to create slide" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const body = await request.json();
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Slide ID required" }, { status: 400 });

    const { error, value } = normalizeBody(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const slide = await HeroSlide.findByIdAndUpdate(id, value, { new: true });
    if (!slide) return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    return NextResponse.json({ slide });
  } catch (err) {
    console.error("PUT /api/wox/admin/hero-slides error:", err);
    return NextResponse.json({ error: "Failed to update slide" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await HeroSlide.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/wox/admin/hero-slides error:", err);
    return NextResponse.json({ error: "Failed to delete slide" }, { status: 500 });
  }
}
